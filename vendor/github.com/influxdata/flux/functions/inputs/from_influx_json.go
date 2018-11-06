package inputs

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"strings"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/influxql"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
	"github.com/pkg/errors"
)

const FromInfluxJSONKind = "fromInfluxJSON"
const bufferSize = 8192

func init() {
	fromInfluxJSONSignature := semantic.FunctionPolySignature{
		Parameters: map[string]semantic.PolyType{
			"json": semantic.String,
			"file": semantic.String,
		},
		Required: nil,
		Return:   flux.TableObjectType,
	}
	flux.RegisterFunction(FromInfluxJSONKind, createFromInfluxJSONOpSpec, fromInfluxJSONSignature)
	flux.RegisterOpSpec(FromInfluxJSONKind, newFromInfluxJSONOp)
	plan.RegisterProcedureSpec(FromInfluxJSONKind, newFromInfluxJSONProcedure, FromInfluxJSONKind)
	execute.RegisterSource(FromInfluxJSONKind, createFromInfluxJSONSource)
}

func createFromInfluxJSONOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	var spec = new(FromInfluxJSONOpSpec)

	if json, ok, err := args.GetString("json"); err != nil {
		return nil, err
	} else if ok {
		spec.JSON = json
	}

	if file, ok, err := args.GetString("file"); err != nil {
		return nil, err
	} else if ok {
		spec.File = file
	}

	if spec.JSON == "" && spec.File == "" {
		return nil, errors.New("must provide json raw text or filename")
	}

	if spec.JSON != "" && spec.File != "" {
		return nil, errors.New("must provide exactly one of the parameters json or file")
	}

	if spec.File != "" {
		if _, err := os.Stat(spec.File); err != nil {
			return nil, errors.Wrapf(err, "failed to stat json file: %s", spec.File)
		}
	}

	return spec, nil
}

// FromInfluxJSONOpSpec defines the `fromInfluxJSON` function signature
type FromInfluxJSONOpSpec struct {
	JSON string `json:"json"`
	File string `json:"file"`
}

func newFromInfluxJSONOp() flux.OperationSpec {
	return new(FromInfluxJSONOpSpec)
}

func (s *FromInfluxJSONOpSpec) Kind() flux.OperationKind {
	return FromInfluxJSONKind
}

// FromInfluxJSONProcedureSpec describes the `fromInfluxJSON` prodecure
type FromInfluxJSONProcedureSpec struct {
	plan.DefaultCost
	JSON string
	File string
}

func newFromInfluxJSONProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*FromInfluxJSONOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}
	return &FromInfluxJSONProcedureSpec{
		JSON: spec.JSON,
		File: spec.File,
	}, nil
}

func (s *FromInfluxJSONProcedureSpec) Kind() plan.ProcedureKind {
	return FromInfluxJSONKind
}

func (s *FromInfluxJSONProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(FromInfluxJSONProcedureSpec)
	ns.JSON = s.JSON
	ns.File = s.File
	return ns
}

func createFromInfluxJSONSource(prSpec plan.ProcedureSpec, dsid execute.DatasetID, a execute.Administration) (execute.Source, error) {
	spec, ok := prSpec.(*FromInfluxJSONProcedureSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", prSpec)
	}

	var jsonReader io.Reader

	if spec.File != "" {
		f, err := os.Open(spec.File)
		if err != nil {
			return nil, err
		}
		jsonReader = bufio.NewReaderSize(f, bufferSize)
	} else {
		jsonReader = strings.NewReader(spec.JSON)
	}

	decoder := influxql.NewResultDecoder(a.Allocator())
	results, err := decoder.Decode(ioutil.NopCloser(jsonReader))
	if err != nil {
		return nil, err
	}

	return &JSONSource{id: dsid, results: results}, nil
}

type JSONSource struct {
	results flux.ResultIterator
	id      execute.DatasetID
	ts      []execute.Transformation
}

func (c *JSONSource) AddTransformation(t execute.Transformation) {
	c.ts = append(c.ts, t)
}

func (c *JSONSource) Run(ctx context.Context) {
	var err error
	var max execute.Time
	var maxSet bool

	err = c.results.Next().Tables().Do(func(tbl flux.Table) error {
		for _, t := range c.ts {
			err := t.Process(c.id, tbl)
			if err != nil {
				return err
			}
			if idx := execute.ColIdx(execute.DefaultStopColLabel, tbl.Key().Cols()); idx >= 0 {
				if stop := tbl.Key().ValueTime(idx); !maxSet || stop > max {
					max = stop
					maxSet = true
				}
			}
		}
		return nil
	})

	if err != nil {
		goto FINISH
	}

	if maxSet {
		for _, t := range c.ts {
			err = t.UpdateWatermark(c.id, max)
			if err != nil {
				goto FINISH
			}
		}
	}

	if c.results.More() {
		// It doesn't make sense to read multiple results
		err = errors.Wrap(err, "'fromInfluxJSON' supports only single results")
	}

FINISH:
	for _, t := range c.ts {
		t.Finish(c.id, err)
	}
}

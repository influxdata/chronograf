package outputs

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"runtime"
	"sort"
	"strings"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/internal/pkg/syncutil"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
	protocol "github.com/influxdata/line-protocol"
	"github.com/pkg/errors"
)

const (
	ToHTTPKind           = "toHTTP"
	DefaultToHTTPTimeout = 1 * time.Second
)

func init() {
	toHTTPSignature := flux.FunctionSignature(
		map[string]semantic.PolyType{
			"url":          semantic.String,
			"method":       semantic.String,
			"name":         semantic.String,
			"timeout":      semantic.Duration,
			"timeColumn":   semantic.String,
			"tagColumns":   semantic.NewArrayPolyType(semantic.String),
			"valueColumns": semantic.NewArrayPolyType(semantic.String),
		},
		[]string{"url"},
	)

	flux.RegisterFunctionWithSideEffect(ToHTTPKind, createToHTTPOpSpec, toHTTPSignature)
	flux.RegisterOpSpec(ToHTTPKind,
		func() flux.OperationSpec { return &ToHTTPOpSpec{} })
	plan.RegisterProcedureSpecWithSideEffect(ToHTTPKind, newToHTTPProcedure, ToHTTPKind)
	execute.RegisterTransformation(ToHTTPKind, createToHTTPTransformation)
}

// DefaultToHTTPUserAgent is the default user agent used by ToHttp
var DefaultToHTTPUserAgent = "fluxd/dev"

func newToHTTPClient() *http.Client {
	return &http.Client{
		Transport: &http.Transport{
			Proxy: http.ProxyFromEnvironment,
			DialContext: (&net.Dialer{
				Timeout:   30 * time.Second,
				KeepAlive: 30 * time.Second,
				DualStack: true,
			}).DialContext,
			MaxIdleConns:          100,
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   10 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
			MaxIdleConnsPerHost:   runtime.GOMAXPROCS(0) + 1,
		},
	}
}

var toHTTPKeepAliveClient = newToHTTPClient()

// this is used so we can get better validation on marshaling, innerToHTTPOpSpec and ToHTTPOpSpec
// need to have identical fields
type innerToHTTPOpSpec ToHTTPOpSpec

type ToHTTPOpSpec struct {
	URL          string            `json:"url"`
	Method       string            `json:"method"` // default behavior should be POST
	Name         string            `json:"name"`
	NameColumn   string            `json:"nameColumn"` // either name or name_column must be set, if none is set try to use the "_measurement" column.
	Headers      map[string]string `json:"headers"`    // TODO: implement Headers after bug with keys and arrays and objects is fixed (new parser implemented, with string literals as keys)
	URLParams    map[string]string `json:"urlParams"`  // TODO: implement URLParams after bug with keys and arrays and objects is fixed (new parser implemented, with string literals as keys)
	Timeout      time.Duration     `json:"timeout"`    // default to something reasonable if zero
	NoKeepAlive  bool              `json:"noKeepAlive"`
	TimeColumn   string            `json:"timeColumn"`
	TagColumns   []string          `json:"tagColumns"`
	ValueColumns []string          `json:"valueColumns"`
}

// ReadArgs loads a flux.Arguments into ToHTTPOpSpec.  It sets several default values.
// If the http method isn't set, it defaults to POST, it also uppercases the http method.
// If the time_column isn't set, it defaults to execute.TimeColLabel.
// If the value_column isn't set it defaults to a []string{execute.DefaultValueColLabel}.
func (o *ToHTTPOpSpec) ReadArgs(args flux.Arguments) error {
	var err error
	o.URL, err = args.GetRequiredString("url")
	if err != nil {
		return err
	}

	var ok bool
	o.Name, ok, err = args.GetString("name")
	if err != nil {
		return err
	}
	if !ok {
		o.NameColumn, ok, err = args.GetString("nameColumn")
		if err != nil {
			return err
		}
		if !ok {
			o.NameColumn = "_measurement"
		}
	}

	o.Method, ok, err = args.GetString("method")
	if err != nil {
		return err
	}
	if !ok {
		o.Method = "POST"
	}
	o.Method = strings.ToUpper(o.Method)

	timeout, ok, err := args.GetDuration("timeout")
	if err != nil {
		return err
	}
	if !ok {
		o.Timeout = DefaultToHTTPTimeout
	} else {
		o.Timeout = time.Duration(timeout)
	}

	o.TimeColumn, ok, err = args.GetString("timeColumn")
	if err != nil {
		return err
	}
	if !ok {
		o.TimeColumn = execute.DefaultTimeColLabel
	}

	tagColumns, ok, err := args.GetArray("tagColumns", semantic.String)
	if err != nil {
		return err
	}
	o.TagColumns = o.TagColumns[:0]
	if ok {
		for i := 0; i < tagColumns.Len(); i++ {
			o.TagColumns = append(o.TagColumns, tagColumns.Get(i).Str())
		}
		sort.Strings(o.TagColumns)
	}

	valueColumns, ok, err := args.GetArray("valueColumns", semantic.String)
	if err != nil {
		return err
	}
	o.ValueColumns = o.ValueColumns[:0]

	if !ok || valueColumns.Len() == 0 {
		o.ValueColumns = append(o.ValueColumns, execute.DefaultValueColLabel)
	} else {
		for i := 0; i < valueColumns.Len(); i++ {
			o.TagColumns = append(o.ValueColumns, valueColumns.Get(i).Str())
		}
		sort.Strings(o.TagColumns)
	}

	// TODO: get other headers working!
	o.Headers = map[string]string{
		"Content-Type": "application/vnd.influx",
		"User-Agent":   DefaultToHTTPUserAgent,
	}

	return err

}

func createToHTTPOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	if err := a.AddParentFromArgs(args); err != nil {
		return nil, err
	}
	s := new(ToHTTPOpSpec)
	if err := s.ReadArgs(args); err != nil {
		return nil, err
	}
	return s, nil
}

// UnmarshalJSON unmarshals and validates toHTTPOpSpec into JSON.
func (o *ToHTTPOpSpec) UnmarshalJSON(b []byte) (err error) {

	if err = json.Unmarshal(b, (*innerToHTTPOpSpec)(o)); err != nil {
		return err
	}
	u, err := url.ParseRequestURI(o.URL)
	if err != nil {
		return err
	}
	if !(u.Scheme == "https" || u.Scheme == "http" || u.Scheme == "") {
		return fmt.Errorf("Scheme must be http or https but was %s", u.Scheme)
	}
	return nil
}

func (ToHTTPOpSpec) Kind() flux.OperationKind {
	return ToHTTPKind
}

type ToHTTPProcedureSpec struct {
	Spec *ToHTTPOpSpec
}

func (o *ToHTTPProcedureSpec) Kind() plan.ProcedureKind {
	return ToHTTPKind
}

func (o *ToHTTPProcedureSpec) Copy() plan.ProcedureSpec {
	s := o.Spec
	res := &ToHTTPProcedureSpec{
		Spec: &ToHTTPOpSpec{
			URL:          s.URL,
			Method:       s.Method,
			Name:         s.Name,
			NameColumn:   s.NameColumn,
			Headers:      make(map[string]string, len(s.Headers)),
			URLParams:    make(map[string]string, len(s.URLParams)),
			Timeout:      s.Timeout,
			NoKeepAlive:  s.NoKeepAlive,
			TimeColumn:   s.TimeColumn,
			TagColumns:   append([]string(nil), s.TagColumns...),
			ValueColumns: append([]string(nil), s.ValueColumns...),
		},
	}
	for k, v := range s.Headers {
		res.Spec.Headers[k] = v
	}
	for k, v := range s.URLParams {
		res.Spec.URLParams[k] = v
	}
	return res
}

func newToHTTPProcedure(qs flux.OperationSpec, a plan.Administration) (plan.ProcedureSpec, error) {
	spec, ok := qs.(*ToHTTPOpSpec)
	if !ok && spec != nil {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}
	return &ToHTTPProcedureSpec{Spec: spec}, nil
}

func createToHTTPTransformation(id execute.DatasetID, mode execute.AccumulationMode, spec plan.ProcedureSpec, a execute.Administration) (execute.Transformation, execute.Dataset, error) {
	s, ok := spec.(*ToHTTPProcedureSpec)
	if !ok {
		return nil, nil, fmt.Errorf("invalid spec type %T", spec)
	}
	cache := execute.NewTableBuilderCache(a.Allocator())
	d := execute.NewDataset(id, mode, cache)
	t := NewToHTTPTransformation(d, cache, s)
	return t, d, nil
}

type ToHTTPTransformation struct {
	d     execute.Dataset
	cache execute.TableBuilderCache
	spec  *ToHTTPProcedureSpec
}

func (t *ToHTTPTransformation) RetractTable(id execute.DatasetID, key flux.GroupKey) error {
	return t.d.RetractTable(key)
}

func NewToHTTPTransformation(d execute.Dataset, cache execute.TableBuilderCache, spec *ToHTTPProcedureSpec) *ToHTTPTransformation {

	return &ToHTTPTransformation{
		d:     d,
		cache: cache,
		spec:  spec,
	}
}

type toHttpMetric struct {
	tags   []*protocol.Tag
	fields []*protocol.Field
	name   string
	t      time.Time
}

func (m *toHttpMetric) TagList() []*protocol.Tag {
	return m.tags
}
func (m *toHttpMetric) FieldList() []*protocol.Field {
	return m.fields
}

func (m *toHttpMetric) truncateTagsAndFields() {
	m.fields = m.fields[:0]
	m.tags = m.tags[:0]

}

func (m *toHttpMetric) Name() string {
	return m.name
}

func (m *toHttpMetric) Time() time.Time {
	return m.t
}

// setCols must be called after

type idxType struct {
	Idx  int
	Type flux.ColType
}

func (t *ToHTTPTransformation) Process(id execute.DatasetID, tbl flux.Table) error {
	pr, pw := io.Pipe() // TODO: replce the pipe with something faster
	m := &toHttpMetric{}
	e := protocol.NewEncoder(pw)
	e.FailOnFieldErr(true)
	e.SetFieldSortOrder(protocol.SortFields)
	cols := tbl.Cols()
	labels := make(map[string]idxType, len(cols))
	for i, col := range cols {
		labels[col.Label] = idxType{Idx: i, Type: col.Type}
	}

	// do time
	timeColLabel := t.spec.Spec.TimeColumn
	timeColIdx, ok := labels[timeColLabel]

	if !ok {
		return errors.New("Could not get time column")
	}
	if timeColIdx.Type != flux.TTime {
		return fmt.Errorf("column %s is not of type %s", timeColLabel, timeColIdx.Type)
	}
	var measurementNameCol string
	if t.spec.Spec.Name == "" {
		measurementNameCol = t.spec.Spec.NameColumn
	}

	// check if each col is a tag or value and cache this value for the loop
	colMetadatas := tbl.Cols()
	isTag := make([]bool, len(colMetadatas))
	isValue := make([]bool, len(colMetadatas))

	for i, col := range colMetadatas {
		isValue[i] = sort.SearchStrings(t.spec.Spec.ValueColumns, col.Label) < len(t.spec.Spec.ValueColumns) && t.spec.Spec.ValueColumns[sort.SearchStrings(t.spec.Spec.ValueColumns, col.Label)] == col.Label
		isTag[i] = sort.SearchStrings(t.spec.Spec.TagColumns, col.Label) < len(t.spec.Spec.TagColumns) && t.spec.Spec.TagColumns[sort.SearchStrings(t.spec.Spec.TagColumns, col.Label)] == col.Label
	}

	builder, new := t.cache.TableBuilder(tbl.Key())
	if new {
		if err := execute.AddTableCols(tbl, builder); err != nil {
			return err
		}
	}

	var wg syncutil.WaitGroup
	wg.Do(func() error {
		m.name = t.spec.Spec.Name
		err := tbl.Do(func(er flux.ColReader) error {
			l := er.Len()
			for i := 0; i < l; i++ {
				m.truncateTagsAndFields()
				for j, col := range er.Cols() {
					switch {
					case col.Label == timeColLabel:
						m.t = er.Times(j)[i].Time()
					case measurementNameCol != "" && measurementNameCol == col.Label:
						if col.Type != flux.TString {
							return errors.New("invalid type for measurement column")
						}
						m.name = er.Strings(j)[i]
					case isTag[j]:
						if col.Type != flux.TString {
							return errors.New("invalid type for measurement column")
						}
						m.tags = append(m.tags, &protocol.Tag{Key: col.Label, Value: er.Strings(j)[i]})

					case isValue[j]:
						switch col.Type {
						case flux.TFloat:
							m.fields = append(m.fields, &protocol.Field{Key: col.Label, Value: er.Floats(j)[i]})
						case flux.TInt:
							m.fields = append(m.fields, &protocol.Field{Key: col.Label, Value: er.Ints(j)[i]})
						case flux.TUInt:
							m.fields = append(m.fields, &protocol.Field{Key: col.Label, Value: er.UInts(j)[i]})
						case flux.TString:
							m.fields = append(m.fields, &protocol.Field{Key: col.Label, Value: er.Strings(j)[i]})
						case flux.TTime:
							m.fields = append(m.fields, &protocol.Field{Key: col.Label, Value: er.Times(j)[i]})
						case flux.TBool:
							m.fields = append(m.fields, &protocol.Field{Key: col.Label, Value: er.Bools(j)[i]})
						default:
							return fmt.Errorf("invalid type for column %s", col.Label)
						}
					}
				}
				_, err := e.Encode(m)
				if err != nil {
					return err
				}

				if err := execute.AppendRecord(i, er, builder); err != nil {
					return err
				}
			}
			return nil
		})
		if e := pw.Close(); e != nil && err == nil {
			err = e
		}
		return err
	})

	req, err := http.NewRequest(t.spec.Spec.Method, t.spec.Spec.URL, pr)
	if err != nil {
		return err
	}

	if t.spec.Spec.Timeout <= 0 {
		ctx, cancel := context.WithTimeout(context.Background(), t.spec.Spec.Timeout)
		req = req.WithContext(ctx)
		defer cancel()
	}
	var resp *http.Response
	if t.spec.Spec.NoKeepAlive {
		resp, err = newToHTTPClient().Do(req)
	} else {
		resp, err = toHTTPKeepAliveClient.Do(req)

	}
	if err != nil {
		return err
	}
	if err := wg.Wait(); err != nil {
		return err
	}
	if err := resp.Body.Close(); err != nil {
		return err
	}

	return req.Body.Close()
}

func (t *ToHTTPTransformation) UpdateWatermark(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateWatermark(pt)
}
func (t *ToHTTPTransformation) UpdateProcessingTime(id execute.DatasetID, pt execute.Time) error {
	return t.d.UpdateProcessingTime(pt)
}
func (t *ToHTTPTransformation) Finish(id execute.DatasetID, err error) {
	t.d.Finish(err)
}

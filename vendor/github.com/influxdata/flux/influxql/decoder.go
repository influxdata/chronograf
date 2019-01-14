package influxql

import (
	"encoding/json"
	"errors"
	"io"
	"sort"
	"strconv"
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/memory"
	"github.com/influxdata/flux/values"
)

// NewResultDecoder will construct a new result decoder for an influxql response.
func NewResultDecoder(a *memory.Allocator) flux.MultiResultDecoder {
	return &resultDecoder{a: a}
}

type resultDecoder struct {
	a *memory.Allocator
}

func (dec *resultDecoder) Decode(r io.ReadCloser) (flux.ResultIterator, error) {
	var resp Response
	if err := json.NewDecoder(r).Decode(&resp); err != nil {
		return nil, err
	}
	return &resultIterator{resp: &resp, a: dec.a}, nil
}

type resultIterator struct {
	resp *Response
	a    *memory.Allocator
}

func (ri *resultIterator) More() bool {
	return len(ri.resp.Results) > 0 && ri.resp.Results[0].Err == ""
}

func (ri *resultIterator) Next() flux.Result {
	res := ri.resp.Results[0]
	ri.resp.Results = ri.resp.Results[1:]
	return &result{res: &res, a: ri.a}
}

func (ri *resultIterator) Release() {
	ri.resp.Results = nil
}

func (ri *resultIterator) Err() error {
	if ri.resp.Err != "" {
		return errors.New(ri.resp.Err)
	} else if len(ri.resp.Results) > 0 && ri.resp.Results[0].Err != "" {
		return errors.New(ri.resp.Results[0].Err)
	}
	return nil
}

func (ri *resultIterator) Statistics() flux.Statistics { return flux.Statistics{} }

type result struct {
	res *Result
	a   *memory.Allocator
}

func (r *result) Name() string {
	return strconv.Itoa(r.res.StatementID)
}

func (r *result) Tables() flux.TableIterator {
	return r
}

func (r *result) Do(f func(tbl flux.Table) error) error {
	// Iterate through each series within the table.
	for _, series := range r.res.Series {
		// Find the time column.
		// TODO(jsternberg): Allow the time column to be customized.
		timeCol := -1
		for i, col := range series.Columns {
			if col == "time" {
				timeCol = i
				break
			}
		}

		// Within each series, we have a common group key base. Construct that here.
		seriesKeyBuilder := execute.NewGroupKeyBuilder(nil)
		if series.Name != "" {
			seriesKeyBuilder.AddKeyValue("_measurement", values.NewString(series.Name))
		}

		tagKeys := make([]string, 0, len(series.Tags))
		for k := range series.Tags {
			tagKeys = append(tagKeys, k)
		}
		sort.Strings(tagKeys)
		for _, k := range tagKeys {
			seriesKeyBuilder.AddKeyValue(k, values.NewString(series.Tags[k]))
		}

		seriesKey, err := seriesKeyBuilder.Build()
		if err != nil {
			return err
		}

		// Iterate through the columns and create a new table for each field.
		for i, col := range series.Columns {
			if i == timeCol {
				// Skip the time column if one was found.
				continue
			}

			// Construct the key using the field name.
			gkb := execute.NewGroupKeyBuilder(seriesKey)
			gkb.AddKeyValue("_field", values.NewString(col))
			key, err := gkb.Build()
			if err != nil {
				return err
			}

			// Construct a new table.
			b := execute.NewColListTableBuilder(key, r.a)

			// If we have a time column, do it here.
			if timeCol >= 0 {
				if _, err := b.AddCol(flux.ColMeta{
					Label: execute.DefaultTimeColLabel,
					Type:  flux.TTime,
				}); err != nil {
					return err
				}
			}
			if err := execute.AddTableKeyCols(key, b); err != nil {
				return err
			}

			// Search for the first non-null value in the column.
			valueIdx := -1
			for _, row := range series.Values {
				if row[i] == nil {
					continue
				}

				valueIdx, err = b.AddCol(flux.ColMeta{
					Label: execute.DefaultValueColLabel,
					Type:  flux.ColumnType(values.New(row[i]).Type()),
				})
				if err != nil {
					return err
				}
				break
			}

			if valueIdx == -1 {
				// Move to the next column as there are no non-null values.
				continue
			}

			for _, row := range series.Values {
				// Skip null values.
				if row[i] == nil {
					continue
				}

				if timeCol >= 0 {
					s := row[timeCol].(string)
					t, err := time.Parse(time.RFC3339, s)
					if err != nil {
						return err
					}
					if err := b.AppendTime(0, values.Time(t.UnixNano())); err != nil {
						return err
					}
				}

				if err := execute.AppendKeyValues(key, b); err != nil {
					return err
				}

				v := values.New(row[i])
				if err := b.AppendValue(b.NCols()-1, v); err != nil {
					return err
				}
			}

			if table, err := b.Table(); err != nil {
				return err
			} else if err := f(table); err != nil {
				return err
			}
		}
	}
	return nil
}

func (ri *result) Statistics() flux.Statistics { return flux.Statistics{} }

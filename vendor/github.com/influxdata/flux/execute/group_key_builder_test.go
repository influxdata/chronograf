package execute_test

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/values"

	"github.com/influxdata/flux/execute"
)

func TestGroupKeyBuilder_Empty(t *testing.T) {
	var gkb execute.GroupKeyBuilder
	gkb.AddKeyValue("_measurement", values.NewString("cpu"))

	key, err := gkb.Build()
	if err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	if got, want := len(key.Cols()), 1; got != want {
		t.Fatalf("unexpected number of columns -want/+got:\n\t- %d\n\t+ %d", want, got)
	}

	if got, want := key.Cols(), []flux.ColMeta{
		{Label: "_measurement", Type: flux.TString},
	}; !cmp.Equal(want, got) {
		t.Fatalf("unexpected columns -want/+got:\n%s", cmp.Diff(want, got))
	}

	if got, want := key.Values(), []values.Value{
		values.NewString("cpu"),
	}; !cmp.Equal(want, got) {
		t.Fatalf("unexpected columns -want/+got:\n%s", cmp.Diff(want, got))
	}
}

func TestGroupKeyBuilder_Nil(t *testing.T) {
	gkb := execute.NewGroupKeyBuilder(nil)
	gkb.AddKeyValue("_measurement", values.NewString("cpu"))

	key, err := gkb.Build()
	if err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	if got, want := len(key.Cols()), 1; got != want {
		t.Fatalf("unexpected number of columns -want/+got:\n\t- %d\n\t+ %d", want, got)
	}

	if got, want := key.Cols(), []flux.ColMeta{
		{Label: "_measurement", Type: flux.TString},
	}; !cmp.Equal(want, got) {
		t.Fatalf("unexpected columns -want/+got:\n%s", cmp.Diff(want, got))
	}

	if got, want := key.Values(), []values.Value{
		values.NewString("cpu"),
	}; !cmp.Equal(want, got) {
		t.Fatalf("unexpected columns -want/+got:\n%s", cmp.Diff(want, got))
	}
}

func TestGroupKeyBuilder_Existing(t *testing.T) {
	gkb := execute.NewGroupKeyBuilder(
		execute.NewGroupKey(
			[]flux.ColMeta{
				{
					Label: "_measurement",
					Type:  flux.TString,
				},
			},
			[]values.Value{
				values.NewString("cpu"),
			},
		),
	)
	gkb.AddKeyValue("_field", values.NewString("usage_user"))

	key, err := gkb.Build()
	if err != nil {
		t.Fatalf("unexpected error: %s", err)
	}

	if got, want := len(key.Cols()), 2; got != want {
		t.Fatalf("unexpected number of columns -want/+got:\n\t- %d\n\t+ %d", want, got)
	}

	if got, want := key.Cols(), []flux.ColMeta{
		{Label: "_measurement", Type: flux.TString},
		{Label: "_field", Type: flux.TString},
	}; !cmp.Equal(want, got) {
		t.Fatalf("unexpected columns -want/+got:\n%s", cmp.Diff(want, got))
	}

	if got, want := key.Values(), []values.Value{
		values.NewString("cpu"),
		values.NewString("usage_user"),
	}; !cmp.Equal(want, got) {
		t.Fatalf("unexpected columns -want/+got:\n%s", cmp.Diff(want, got))
	}
}

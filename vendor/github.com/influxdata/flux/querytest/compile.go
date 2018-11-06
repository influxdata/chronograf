package querytest

import (
	"context"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/functions/transformations"
	"github.com/influxdata/flux/semantic/semantictest"
)

type NewQueryTestCase struct {
	Name    string
	Raw     string
	Want    *flux.Spec
	WantErr bool
}

var opts = append(
	semantictest.CmpOptions,
	cmp.AllowUnexported(flux.Spec{}),
	cmp.AllowUnexported(transformations.JoinOpSpec{}),
	cmpopts.IgnoreUnexported(flux.Spec{}),
	cmpopts.IgnoreUnexported(transformations.JoinOpSpec{}),
)

func NewQueryTestHelper(t *testing.T, tc NewQueryTestCase) {
	t.Helper()

	now := time.Now().UTC()
	got, err := flux.Compile(context.Background(), tc.Raw, now)
	if (err != nil) != tc.WantErr {
		t.Errorf("error compiling spec error = %v, wantErr %v", err, tc.WantErr)
		return
	}
	if tc.WantErr {
		return
	}
	if tc.Want != nil {
		tc.Want.Now = now
		if !cmp.Equal(tc.Want, got, opts...) {
			t.Errorf("unexpected specs -want/+got %s", cmp.Diff(tc.Want, got, opts...))
		}
	}
}

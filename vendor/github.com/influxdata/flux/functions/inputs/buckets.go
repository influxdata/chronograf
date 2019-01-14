package inputs

import (
	"fmt"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/plan"
	"github.com/influxdata/flux/semantic"
)

const BucketsKind = "buckets"

type BucketsOpSpec struct {
}

func init() {
	bucketsSignature := semantic.FunctionPolySignature{
		Return: flux.TableObjectType,
	}

	flux.RegisterFunction(BucketsKind, createBucketsOpSpec, bucketsSignature)
	flux.RegisterOpSpec(BucketsKind, newBucketsOp)
	plan.RegisterProcedureSpec(BucketsKind, newBucketsProcedure, BucketsKind)
}

func createBucketsOpSpec(args flux.Arguments, a *flux.Administration) (flux.OperationSpec, error) {
	spec := new(BucketsOpSpec)
	return spec, nil
}

func newBucketsOp() flux.OperationSpec {
	return new(BucketsOpSpec)
}

func (s *BucketsOpSpec) Kind() flux.OperationKind {
	return BucketsKind
}

type BucketsProcedureSpec struct {
	plan.DefaultCost
}

func newBucketsProcedure(qs flux.OperationSpec, pa plan.Administration) (plan.ProcedureSpec, error) {
	_, ok := qs.(*BucketsOpSpec)
	if !ok {
		return nil, fmt.Errorf("invalid spec type %T", qs)
	}

	return &BucketsProcedureSpec{}, nil
}

func (s *BucketsProcedureSpec) Kind() plan.ProcedureKind {
	return BucketsKind
}

func (s *BucketsProcedureSpec) Copy() plan.ProcedureSpec {
	ns := new(BucketsProcedureSpec)
	return ns
}

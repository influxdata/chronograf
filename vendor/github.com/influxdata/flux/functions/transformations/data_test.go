package transformations_test

import (
	"time"

	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/execute/executetest"
	"github.com/influxdata/flux/values"
	"golang.org/x/exp/rand"
	"gonum.org/v1/gonum/stat/distuv"
)

const (
	N     = 1e6
	Mu    = 10
	Sigma = 3

	seed = 42
)

// NormalData is a slice of N random values that are normaly distributed with mean Mu and standard deviation Sigma.
var NormalData []float64

// NormalTable is a table of data whose value col is NormalData.
var NormalTable flux.Table

func init() {
	dist := distuv.Normal{
		Mu:    Mu,
		Sigma: Sigma,
		Src:   rand.New(rand.NewSource(seed)),
	}
	NormalData = make([]float64, N)
	for i := range NormalData {
		NormalData[i] = dist.Rand()
	}
	start := execute.Time(time.Date(2016, 10, 10, 0, 0, 0, 0, time.UTC).UnixNano())
	stop := execute.Time(time.Date(2017, 10, 10, 0, 0, 0, 0, time.UTC).UnixNano())
	t1Value := "a"
	key := execute.NewGroupKey(
		[]flux.ColMeta{
			{Label: execute.DefaultStartColLabel, Type: flux.TTime},
			{Label: execute.DefaultStopColLabel, Type: flux.TTime},
			{Label: "t1", Type: flux.TString},
		},
		[]values.Value{
			values.NewTime(start),
			values.NewTime(stop),
			values.NewString(t1Value),
		},
	)
	normalTableBuilder := execute.NewColListTableBuilder(key, executetest.UnlimitedAllocator)

	if _, err := normalTableBuilder.AddCol(flux.ColMeta{Label: execute.DefaultTimeColLabel, Type: flux.TTime}); err != nil {
		return
	}
	if _, err := normalTableBuilder.AddCol(flux.ColMeta{Label: execute.DefaultStartColLabel, Type: flux.TTime}); err != nil {
		return
	}
	if _, err := normalTableBuilder.AddCol(flux.ColMeta{Label: execute.DefaultStopColLabel, Type: flux.TTime}); err != nil {
		return
	}
	if _, err := normalTableBuilder.AddCol(flux.ColMeta{Label: execute.DefaultValueColLabel, Type: flux.TFloat}); err != nil {
		return
	}
	if _, err := normalTableBuilder.AddCol(flux.ColMeta{Label: "t1", Type: flux.TString}); err != nil {
		return
	}
	if _, err := normalTableBuilder.AddCol(flux.ColMeta{Label: "t2", Type: flux.TString}); err != nil {
		return
	}

	times := make([]execute.Time, N)
	startTimes := make([]execute.Time, N)
	stopTimes := make([]execute.Time, N)
	normalValues := NormalData
	t1 := make([]string, N)
	t2 := make([]string, N)

	for i, v := range normalValues {
		startTimes[i] = start
		stopTimes[i] = stop
		t1[i] = t1Value
		// There are roughly 1 million, 31 second intervals in a year.
		times[i] = start + execute.Time(time.Duration(i*31)*time.Second)
		// Pick t2 based off the value
		switch int(v) % 3 {
		case 0:
			t2[i] = "x"
		case 1:
			t2[i] = "y"
		case 2:
			t2[i] = "z"
		}
	}

	_ = normalTableBuilder.AppendTimes(0, times)
	_ = normalTableBuilder.AppendTimes(1, startTimes)
	_ = normalTableBuilder.AppendTimes(2, stopTimes)
	_ = normalTableBuilder.AppendFloats(3, normalValues)
	_ = normalTableBuilder.AppendStrings(4, t1)
	_ = normalTableBuilder.AppendStrings(5, t2)

	NormalTable, _ = normalTableBuilder.Table()
}

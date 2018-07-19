package tdigest_test

import (
	"math/rand"
	"testing"

	"github.com/gonum/stat/distuv"
	"github.com/influxdata/tdigest"
)

const (
	N     = 1e6
	Mu    = 10
	Sigma = 3

	seed = 42
)

// NormalData is a slice of N random values that are normaly distributed with mean Mu and standard deviation Sigma.
var NormalData []float64
var UniformData []float64

var NormalDigest *tdigest.TDigest
var UniformDigest *tdigest.TDigest

func init() {
	dist := distuv.Normal{
		Mu:     Mu,
		Sigma:  Sigma,
		Source: rand.New(rand.NewSource(seed)),
	}
	uniform := rand.New(rand.NewSource(seed))

	UniformData = make([]float64, N)
	UniformDigest = tdigest.NewWithCompression(1000)

	NormalData = make([]float64, N)
	NormalDigest = tdigest.NewWithCompression(1000)

	for i := range NormalData {
		NormalData[i] = dist.Rand()
		NormalDigest.Add(NormalData[i], 1)

		UniformData[i] = uniform.Float64() * 100
		UniformDigest.Add(UniformData[i], 1)
	}
}

func TestTdigest_Quantile(t *testing.T) {
	tests := []struct {
		name     string
		data     []float64
		digest   *tdigest.TDigest
		quantile float64
		want     float64
	}{
		{
			name:     "increasing",
			quantile: 0.5,
			data:     []float64{1, 2, 3, 4, 5},
			want:     3,
		},
		{
			name:     "small",
			quantile: 0.5,
			data:     []float64{1, 2, 3, 4, 5, 5, 4, 3, 2, 1},
			want:     3,
		},
		{
			name:     "small 99 (max)",
			quantile: 0.99,
			data:     []float64{1, 2, 3, 4, 5, 5, 4, 3, 2, 1},
			want:     5,
		},
		{
			name:     "normal 50",
			quantile: 0.5,
			digest:   NormalDigest,
			want:     9.997821231634168,
		},
		{
			name:     "normal 90",
			quantile: 0.9,
			digest:   NormalDigest,
			want:     13.843815760607427,
		},
		{
			name:     "uniform 50",
			quantile: 0.5,
			digest:   UniformDigest,
			want:     50.02682856274754,
		},
		{
			name:     "uniform 90",
			quantile: 0.9,
			digest:   UniformDigest,
			want:     90.02117754660424,
		},
		{
			name:     "uniform 99",
			quantile: 0.99,
			digest:   UniformDigest,
			want:     99.00246731511771,
		},
		{
			name:     "uniform 99.9",
			quantile: 0.999,
			digest:   UniformDigest,
			want:     99.90178495422307,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			td := tt.digest
			if td == nil {
				td = tdigest.NewWithCompression(1000)
				for _, x := range tt.data {
					td.Add(x, 1)
				}
			}
			got := td.Quantile(tt.quantile)
			if got != tt.want {
				t.Errorf("unexpected quantile %f, got %g want %g", tt.quantile, got, tt.want)
			}
		})
	}
}

func TestTdigest_CDFs(t *testing.T) {
	tests := []struct {
		name   string
		data   []float64
		digest *tdigest.TDigest
		cdf    float64
		want   float64
	}{
		{
			name: "increasing",
			cdf:  3,
			data: []float64{1, 2, 3, 4, 5},
			want: 0.5,
		},
		{
			name: "small",
			cdf:  4,
			data: []float64{1, 2, 3, 4, 5, 5, 4, 3, 2, 1},
			want: 0.75,
		},
		{
			name: "small max",
			cdf:  5,
			data: []float64{1, 2, 3, 4, 5, 5, 4, 3, 2, 1},
			want: 1,
		},
		{
			name: "normal mean",
			cdf:  10,
			data: NormalData,
			want: 0.500298235578106,
		},
		{
			name: "normal high",
			cdf:  -100,
			data: NormalData,
			want: 0,
		},
		{
			name: "normal low",
			cdf:  110,
			data: NormalData,
			want: 1,
		},
		{
			name: "uniform 50",
			cdf:  50,
			data: UniformData,
			want: 0.49972989818712815,
		},
		{
			name: "uniform min",
			cdf:  0,
			data: UniformData,
			want: 0,
		},
		{
			name: "uniform max",
			cdf:  100,
			data: UniformData,
			want: 1,
		},
		{
			name: "uniform 10",
			cdf:  10,
			data: UniformData,
			want: 0.099715527526992,
		},
		{
			name: "uniform 90",
			cdf:  90,
			data: UniformData,
			want: 0.8997838903965611,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			td := tt.digest
			if td == nil {
				td = tdigest.NewWithCompression(1000)
				for _, x := range tt.data {
					td.Add(x, 1)
				}
			}
			got := td.CDF(tt.cdf)
			if got != tt.want {
				t.Errorf("unexpected CDF %f, got %g want %g", tt.cdf, got, tt.want)
			}
		})
	}
}

var quantiles = []float64{0.1, 0.5, 0.9, 0.99, 0.999}

func BenchmarkTDigest_Add(b *testing.B) {
	for n := 0; n < b.N; n++ {
		td := tdigest.NewWithCompression(1000)
		for _, x := range NormalData {
			td.Add(x, 1)
		}
	}
}
func BenchmarkTDigest_Quantile(b *testing.B) {
	td := tdigest.NewWithCompression(1000)
	for _, x := range NormalData {
		td.Add(x, 1)
	}
	b.ResetTimer()
	var x float64
	for n := 0; n < b.N; n++ {
		for _, q := range quantiles {
			x += td.Quantile(q)
		}
	}
}

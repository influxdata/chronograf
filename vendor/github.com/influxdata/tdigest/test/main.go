package main

import (
	"bufio"
	"os"
	"strconv"

	"github.com/influxdata/tdigest"
)

var quantiles = []float64{
	0.1,
	0.2,
	0.5,
	0.75,
	0.9,
	0.99,
	0.999,
}

var cdfs = map[string][]float64{
	"small.dat":   []float64{0, 1, 4, 5, 6},
	"uniform.dat": []float64{-1, 0, 50, 100, 101},
	"normal.dat":  []float64{-100, 7, 10, 13, 110},
}

var dataFiles = []string{
	"small.dat",
	"uniform.dat",
	"normal.dat",
}

func main() {
	for _, f := range dataFiles {
		data := loadData(f)
		td := createTdigest(data)
		results := computeQuantiles(td, quantiles)
		writeResults(f+".go.quantiles", results)
		results = computeCDFs(td, cdfs[f])
		writeResults(f+".go.cdfs", results)
	}
}

func loadData(name string) []float64 {
	f, err := os.Open(name)
	if err != nil {
		panic(err)
	}
	defer f.Close()
	s := bufio.NewScanner(f)
	var data []float64
	for s.Scan() {
		x, err := strconv.ParseFloat(s.Text(), 64)
		if err != nil {
			panic(err)
		}
		data = append(data, x)
	}
	return data
}

func createTdigest(data []float64) *tdigest.TDigest {
	td := tdigest.NewWithCompression(1000)
	for _, x := range data {
		td.Add(x, 1)
	}
	return td
}

func computeQuantiles(td *tdigest.TDigest, quantiles []float64) (r []float64) {
	for _, q := range quantiles {
		r = append(r, td.Quantile(q))
	}
	return
}

func computeCDFs(td *tdigest.TDigest, cdfs []float64) (r []float64) {
	for _, x := range cdfs {
		r = append(r, td.CDF(x))
	}
	return
}

func writeResults(name string, results []float64) {
	f, err := os.Create(name)
	if err != nil {
		panic(err)
	}
	defer f.Close()
	buf := make([]byte, 0, 64)
	for _, x := range results {
		buf = strconv.AppendFloat(buf, x, 'f', -1, 64)
		_, err := f.Write(buf)
		if err != nil {
			panic(err)
		}
		_, err = f.Write([]byte{'\n'})
		if err != nil {
			panic(err)
		}
		buf = buf[0:0]
	}
}

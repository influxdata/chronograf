package main

import (
	"bufio"
	"log"
	"math"
	"os"
	"strconv"
	"strings"
)

var dataFiles = []string{
	"small.dat",
	"uniform.dat",
	"normal.dat",
}

const (
	cppQExt = ".cpp.quantiles"
	goQExt  = ".go.quantiles"

	cppCDFExt = ".cpp.cdfs"
	goCDFExt  = ".go.cdfs"

	epsilon = 1e-6
)

func main() {
	for _, f := range dataFiles {
		// Validate Quantiles
		cppQuantiles := loadResults(f + cppQExt)
		goQuantiles := loadResults(f + goQExt)
		if len(cppQuantiles) != len(goQuantiles) {
			log.Fatal("differing number of quantiles results")
		}

		for i := range cppQuantiles {
			if math.Abs(cppQuantiles[i]-goQuantiles[i]) > epsilon {
				log.Fatalf("differing quantile result go: %f cpp: %f", goQuantiles[i], cppQuantiles[i])
			}
		}

		// Validate CDFs
		cppCDFs := loadResults(f + cppCDFExt)
		goCDFs := loadResults(f + goCDFExt)
		if len(cppCDFs) != len(goCDFs) {
			log.Fatal("differing number of CDFs results")
		}

		for i := range cppCDFs {
			if math.Abs(cppCDFs[i]-goCDFs[i]) > epsilon {
				log.Fatalf("differing CDF result go: %f cpp: %f", goCDFs[i], cppCDFs[i])
			}
		}
	}
}

func loadResults(name string) []float64 {
	f, err := os.Open(name)
	if err != nil {
		panic(err)
	}
	defer f.Close()
	s := bufio.NewScanner(f)
	var data []float64
	for s.Scan() {
		parts := strings.SplitN(s.Text(), " ", 2)
		x, err := strconv.ParseFloat(parts[0], 64)
		if err != nil {
			panic(err)
		}
		data = append(data, x)
	}
	return data
}

package main

import (
	"math/rand"
	"os"
	"strconv"

	"github.com/gonum/stat/distuv"
)

const (
	N     = 1e6
	Mu    = 10
	Sigma = 3

	seed = 42
)

func main() {
	// Generate uniform and normal data
	uniform := rand.New(rand.NewSource(seed))
	dist := distuv.Normal{
		Mu:     Mu,
		Sigma:  Sigma,
		Source: rand.New(rand.NewSource(seed)),
	}

	uniformData := make([]float64, N)
	normalData := make([]float64, N)
	for i := range normalData {
		normalData[i] = dist.Rand()
		uniformData[i] = uniform.Float64() * 100
	}

	smallData := []float64{1, 2, 3, 4, 5, 5, 4, 3, 2, 1}

	writeData("uniform.dat", uniformData)
	writeData("normal.dat", normalData)
	writeData("small.dat", smallData)
}

func writeData(name string, data []float64) {
	f, err := os.Create(name)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	buf := make([]byte, 0, 64)
	for _, x := range data {
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

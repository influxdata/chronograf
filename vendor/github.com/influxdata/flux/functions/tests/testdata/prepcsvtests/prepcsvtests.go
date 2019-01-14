package main

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"github.com/influxdata/flux"
	"io/ioutil"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	_ "github.com/influxdata/flux/functions/inputs"          // Import the built-in inputs
	_ "github.com/influxdata/flux/functions/outputs"         // Import the built-in outputs
	_ "github.com/influxdata/flux/functions/transformations" // Import the built-in functions

	"github.com/influxdata/flux/csv"
	"github.com/influxdata/flux/lang"
	"github.com/influxdata/flux/querytest"
	"golang.org/x/text/unicode/norm"
)

func init() {
	flux.RegisterBuiltIn("loadTest", loadTestBuiltin)
	flux.FinalizeBuiltIns()
}

var loadTestBuiltin = `
// loadData is a function that's referenced in all the transformation tests.  
// it's registered here so that we can register a different loadData function for 
// each platform/binary.  
testLoadData = (file) => fromCSV(file:file)
testingTest = (name, load, infile, outfile, test) => testLoadData(file:infile) |> test()
`

func normalizeString(s string) []byte {
	result := norm.NFC.String(strings.TrimSpace(s))
	re := regexp.MustCompile(`\r?\n`)
	return []byte(re.ReplaceAllString(result, "\r\n"))
}

func printUsage() {
	fmt.Println("usage: prepcsvtests /path/to/testfiles [testname]")
}

func main() {
	fnames := make([]string, 0)
	path := ""
	var err error
	if len(os.Args) == 3 {
		path = os.Args[1]
		fnames = append(fnames, filepath.Join(path, os.Args[2])+".flux")
	} else if len(os.Args) == 2 {
		path = os.Args[1]
		fnames, err = filepath.Glob(filepath.Join(path, "*.flux"))
		if err != nil {
			return
		}

		if len(fnames) == 0 {
			fmt.Printf("could not find any .flux files in directory \"%s\"", path)
			return
		}
	} else {
		printUsage()
		return
	}

	for _, fname := range fnames {
		ext := ".flux"
		testName := fname[0 : len(fname)-len(ext)]
		incsv := testName + ".in.csv"
		indata, err := ioutil.ReadFile(incsv)
		if err != nil {
			fmt.Printf("could not open file %s", incsv)
			return
		}

		fmt.Printf("Generating output for test case %s\n", testName)

		indata = normalizeString(string(indata))
		fmt.Println("Writing input data to file")
		ioutil.WriteFile(incsv, indata, 0644)

		querytext, err := ioutil.ReadFile(fname)
		if err != nil {
			fmt.Printf("error reading query text: %s", err)
			return
		}

		pqs := querytest.NewQuerier()
		c := lang.FluxCompiler{
			Query: string(querytext),
		}
		d := csv.DefaultDialect()

		var buf bytes.Buffer
		_, err = pqs.Query(context.Background(), &buf, c, d)
		if err != nil {
			fmt.Printf("error: %s", err)
			return
		}

		fmt.Printf("FLUX:\n %s\n\n", querytext)
		fmt.Printf("CHECK RESULT:\n%s\n____________________________________________________________", buf.String())

		reader := bufio.NewReader(os.Stdin)
		fmt.Print("Results ok (y/n)?: ")
		text, _ := reader.ReadString('\n')
		if text == "y\n" {
			fmt.Printf("writing output file: %s", testName+".out.csv")
			ioutil.WriteFile(testName+".out.csv", buf.Bytes(), 0644)
		}
	}
}

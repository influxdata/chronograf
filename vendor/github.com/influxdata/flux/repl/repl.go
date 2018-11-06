// Package repl implements the read-eval-print-loop for the command line flux query console.
package repl

import (
	"context"
	"fmt"
	"io/ioutil"
	"os"
	"os/signal"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"syscall"

	prompt "github.com/c-bata/go-prompt"
	"github.com/influxdata/flux"
	"github.com/influxdata/flux/execute"
	"github.com/influxdata/flux/interpreter"
	"github.com/influxdata/flux/lang"
	"github.com/influxdata/flux/parser"
	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
)

type REPL struct {
	interpreter *interpreter.Interpreter
	querier     Querier

	cancelMu   sync.Mutex
	cancelFunc context.CancelFunc
}

type Querier interface {
	Query(ctx context.Context, compiler flux.Compiler) (flux.ResultIterator, error)
}

func New(q Querier) *REPL {
	itrp := flux.NewInterpreter()
	return &REPL{
		interpreter: itrp,
		querier:     q,
	}
}

func (r *REPL) Run() {
	p := prompt.New(
		r.input,
		r.completer,
		prompt.OptionPrefix("> "),
		prompt.OptionTitle("flux"),
	)
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT)
	go func() {
		for range sigs {
			r.cancel()
		}
	}()
	p.Run()
}

func (r *REPL) cancel() {
	r.cancelMu.Lock()
	defer r.cancelMu.Unlock()
	if r.cancelFunc != nil {
		r.cancelFunc()
		r.cancelFunc = nil
	}
}

func (r *REPL) setCancel(cf context.CancelFunc) {
	r.cancelMu.Lock()
	defer r.cancelMu.Unlock()
	r.cancelFunc = cf
}
func (r *REPL) clearCancel() {
	r.setCancel(nil)
}

func (r *REPL) completer(d prompt.Document) []prompt.Suggest {
	names := r.interpreter.GlobalScope().Names()
	sort.Strings(names)

	s := make([]prompt.Suggest, 0, len(names))
	for _, n := range names {
		if n == "_" || !strings.HasPrefix(n, "_") {
			s = append(s, prompt.Suggest{Text: n})
		}
	}
	if d.Text == "" || strings.HasPrefix(d.Text, "@") {
		root := "./" + strings.TrimPrefix(d.Text, "@")
		fluxFiles, err := getFluxFiles(root)
		if err == nil {
			for _, fName := range fluxFiles {
				s = append(s, prompt.Suggest{Text: "@" + fName})
			}
		}
		dirs, err := getDirs(root)
		if err == nil {
			for _, fName := range dirs {
				s = append(s, prompt.Suggest{Text: "@" + fName + string(os.PathSeparator)})
			}
		}
	}

	return prompt.FilterHasPrefix(s, d.GetWordBeforeCursor(), true)
}

func (r *REPL) Input(t string) error {
	_, err := r.executeLine(t)
	return err
}

// input processes a line of input and prints the result.
func (r *REPL) input(t string) {
	v, err := r.executeLine(t)
	if err != nil {
		fmt.Println("Error:", err)
	} else if v != nil {
		fmt.Println(v)
	}
}

// executeLine processes a line of input.
// If the input evaluates to a valid value, that value is returned.
func (r *REPL) executeLine(t string) (values.Value, error) {
	if t == "" {
		return nil, nil
	}

	if t[0] == '@' {
		q, err := LoadQuery(t)
		if err != nil {
			return nil, err
		}
		t = q
	}

	astProg, err := parser.NewAST(t)
	if err != nil {
		return nil, err
	}

	semProg, err := semantic.New(astProg)
	if err != nil {
		return nil, err
	}

	if err := r.interpreter.Eval(semProg); err != nil {
		return nil, err
	}

	v := r.interpreter.Return()

	// Check for yield and execute query
	if v.Type() == flux.TableObjectMonoType {
		t := v.(*flux.TableObject)
		spec := flux.ToSpec(r.interpreter, t)
		return nil, r.doQuery(spec)
	}

	// Print value
	if v.Type() != semantic.Invalid {
		return v, nil
	}
	return nil, nil
}

func (r *REPL) doQuery(spec *flux.Spec) error {
	// Setup cancel context
	ctx, cancelFunc := context.WithCancel(context.Background())
	r.setCancel(cancelFunc)
	defer cancelFunc()
	defer r.clearCancel()

	compiler := lang.SpecCompiler{
		Spec: spec,
	}

	results, err := r.querier.Query(ctx, compiler)
	if err != nil {
		return err
	}
	defer results.Cancel()

	for results.More() {
		result := results.Next()
		tables := result.Tables()
		fmt.Println("Result:", result.Name())
		err := tables.Do(func(tbl flux.Table) error {
			_, err := execute.NewFormatter(tbl, nil).WriteTo(os.Stdout)
			return err
		})
		if err != nil {
			return err
		}
	}
	return results.Err()
}

func getFluxFiles(path string) ([]string, error) {
	return filepath.Glob(path + "*.flux")
}

func getDirs(path string) ([]string, error) {
	dir := filepath.Dir(path)
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	dirs := make([]string, 0, len(files))
	for _, f := range files {
		if f.IsDir() {
			dirs = append(dirs, filepath.Join(dir, f.Name()))
		}
	}
	return dirs, nil
}

// LoadQuery returns the Flux query q, except for two special cases:
// if q is exactly "-", the query will be read from stdin;
// and if the first character of q is "@",
// the @ prefix is removed and the contents of the file specified by the rest of q are returned.
func LoadQuery(q string) (string, error) {
	if q == "-" {
		data, err := ioutil.ReadAll(os.Stdin)
		if err != nil {
			return "", err
		}
		return string(data), nil
	}

	if len(q) > 0 && q[0] == '@' {
		data, err := ioutil.ReadFile(q[1:])
		if err != nil {
			return "", err
		}

		return string(data), nil
	}

	return q, nil
}

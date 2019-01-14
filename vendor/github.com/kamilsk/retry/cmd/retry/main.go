package main

import (
	"bytes"
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"text/template"
	"time"

	"github.com/briandowns/spinner"
	"github.com/fatih/color"
	"github.com/kamilsk/retry"
	"github.com/pkg/errors"
)

const (
	success = 0
	failed  = 1
)

// DefaultReport is a default template for report.
var DefaultReport = `

---

command: {{ .Name }}
  error: {{ .Error }}
details: started at {{ .Start }}, finished at {{ .End }}, elapsed {{ .Elapsed }}
 stdout:

{{ .Stdout }}

 stderr:

{{ .Stderr }}
`

func main() { application{Args: os.Args, Stderr: os.Stderr, Stdout: os.Stdout, Shutdown: os.Exit}.Run() }

type application struct {
	Args           []string
	Stderr, Stdout io.Writer
	Shutdown       func(code int)
}

// Run executes the application logic.
func (app application) Run() {
	var (
		result, err = parse(app.Stderr, app.Args[0], app.Args[1:]...)
		format      = func() string {
			if result.Debug {
				return "an error occurred: %+v\n"
			}
			return "an error occurred: %v\n"
		}()
		start, finish  time.Time
		shutdown, spin = app.Shutdown, spinner.New(spinner.CharSets[17], 100*time.Millisecond)
		stderr, stdout = bytes.NewBuffer(nil), bytes.NewBuffer(nil)
		report         = template.Must(template.New("report").Parse(DefaultReport))
	)
	if err != nil {
		if err != flag.ErrHelp {
			color.New(color.FgRed).Fprintf(app.Stderr, format, err)
			app.Shutdown(failed)
			return
		}
		app.Shutdown(success)
		return
	}
	command := result.Args[0]
	if len(result.Args) > 1 {
		command += strings.Join(result.Args[1:], " ")
	}

	{
		spin.Prefix = fmt.Sprintf("process `%s`... ", command)
		spin.Writer = app.Stderr
		app.Shutdown = func(code int) {
			finish = time.Now()
			if result.Notify {
				// TODO try to find or implement by myself
				// - https://github.com/variadico/noti
				// - https://github.com/jolicode/JoliNotif
				color.New(color.FgYellow).Fprintln(stderr, "notify component is not ready yet")
			}
			report.Execute(app.Stdout, struct {
				Name       string
				Error      string
				Start, End string
				Elapsed    time.Duration
				Stdout     string
				Stderr     string
			}{
				Name:    command,
				Error:   fmt.Sprintf(format, err),
				Start:   start.Format("2006-01-02 15:04:05.99"),
				End:     finish.Format("2006-01-02 15:04:05.99"),
				Elapsed: finish.Sub(start),
				Stdout:  stdout.String(),
				Stderr:  stderr.String(),
			})
			spin.Stop()
			shutdown(code)
		}
	}

	action := func(attempt uint) error {
		if start.IsZero() {
			spin.Start()
			start = time.Now()
		} else {
			spin.Color("red")
			color.New(color.FgYellow).Fprintf(stderr, "#%d attempt at %s... \n", attempt+1, time.Now().Sub(start))
		}
		cmd := exec.Command(result.Args[0], result.Args[1:]...)
		cmd.Stderr, cmd.Stdout = stderr, stdout
		return errors.WithStack(cmd.Run())
	}
	deadline := retry.Multiplex(
		retry.WithTimeout(result.Timeout),
		retry.WithSignal(os.Interrupt),
	)
	if err = retry.Retry(deadline, action, result.Strategies...); err != nil {
		app.Shutdown(failed)
		return
	}
	app.Shutdown(success)
	return
}

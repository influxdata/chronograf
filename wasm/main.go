package main

import (
	"encoding/json"
	"syscall/js"

	"github.com/influxdata/platform/query/parser"
)

var (
	ast            string
	beforeUnloadCh = make(chan struct{})
)

func main() {
	js.Global.Set("currentAST", ast)

	fluxToASTCallback := js.NewCallback(fluxToAST)
	js.Global.Set("fluxToAST", fluxToASTCallback)
	defer fluxToASTCallback.Close()

	beforeUnloadCallback := js.NewEventCallback(0, beforeUnload)
	defer beforeUnloadCallback.Close()

	addEventListener := js.Global.Get("addEventListener")
	addEventListener.Invoke("beforeunload", beforeUnloadCallback)

	<-beforeUnloadCh
}

func fluxToAST(args []js.Value) {
	query := args[0].String()
	ast, _ := parser.NewAST(query)

	astJSON, _ := json.Marshal(ast)
	js.Global.Set("currentAST", string(astJSON))
	js.Global.Get("window").Get("fluxResolve").Invoke()
}

func beforeUnload(event js.Value) {
	beforeUnloadCh <- struct{}{}
}

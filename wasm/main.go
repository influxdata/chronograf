package main

import (
	"syscall/js"
)

var (
	no             int
	beforeUnloadCh = make(chan struct{})
)

func main() {
	js.Global.Set("currentCount", no)

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
	no++
	js.Global.Set("currentCount", no)
}

func beforeUnload(event js.Value) {
	beforeUnloadCh <- struct{}{}
}

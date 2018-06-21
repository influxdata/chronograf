package main

import (
	"flag"
	"io/ioutil"
	"log"
	"net/http"
)

func main() {
	addr := flag.String("addr", ":5555", "server address:port")
	flag.Parse()
	http.HandleFunc("/wasm/slug.wasm", wasmHandle)

	fs := http.FileServer(http.Dir("."))
	http.Handle("/", fs)

	log.Printf("listening on %q...", *addr)
	log.Fatal(http.ListenAndServe(*addr, nil))
}

func wasmHandle(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/wasm")
	content, _ := ioutil.ReadFile("wasm/slug.wasm")
	w.Write(content)
}

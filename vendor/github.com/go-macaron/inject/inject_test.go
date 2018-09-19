// Copyright 2013 Jeremy Saenz
// Copyright 2015 The Macaron Authors
//
// Licensed under the Apache License, Version 2.0 (the "License"): you may
// not use this file except in compliance with the License. You may obtain
// a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

package inject_test

import (
	"fmt"
	"reflect"
	"testing"

	"github.com/go-macaron/inject"
	. "github.com/smartystreets/goconvey/convey"
)

type SpecialString interface {
}

type TestStruct struct {
	Dep1 string        `inject:"t" json:"-"`
	Dep2 SpecialString `inject`
	Dep3 string
}

type Greeter struct {
	Name string
}

func (g *Greeter) String() string {
	return "Hello, My name is" + g.Name
}

type myFastInvoker func(string)

func (f myFastInvoker) Invoke([]interface{}) ([]reflect.Value, error) {
	return nil, nil
}

func Test_Injector_Invoke(t *testing.T) {
	Convey("Invokes function", t, func() {
		injector := inject.New()
		So(injector, ShouldNotBeNil)

		dep := "some dependency"
		injector.Map(dep)
		dep2 := "another dep"
		injector.MapTo(dep2, (*SpecialString)(nil))
		dep3 := make(chan *SpecialString)
		dep4 := make(chan *SpecialString)
		typRecv := reflect.ChanOf(reflect.RecvDir, reflect.TypeOf(dep3).Elem())
		typSend := reflect.ChanOf(reflect.SendDir, reflect.TypeOf(dep4).Elem())
		injector.Set(typRecv, reflect.ValueOf(dep3))
		injector.Set(typSend, reflect.ValueOf(dep4))

		_, err := injector.Invoke(func(d1 string, d2 SpecialString, d3 <-chan *SpecialString, d4 chan<- *SpecialString) {
			So(d1, ShouldEqual, dep)
			So(d2, ShouldEqual, dep2)
			So(reflect.TypeOf(d3).Elem(), ShouldEqual, reflect.TypeOf(dep3).Elem())
			So(reflect.TypeOf(d4).Elem(), ShouldEqual, reflect.TypeOf(dep4).Elem())
			So(reflect.TypeOf(d3).ChanDir(), ShouldEqual, reflect.RecvDir)
			So(reflect.TypeOf(d4).ChanDir(), ShouldEqual, reflect.SendDir)
		})
		So(err, ShouldBeNil)

		_, err = injector.Invoke(myFastInvoker(func(string) {}))
		So(err, ShouldBeNil)
	})

	Convey("Invokes function with return value", t, func() {
		injector := inject.New()
		So(injector, ShouldNotBeNil)

		dep := "some dependency"
		injector.Map(dep)
		dep2 := "another dep"
		injector.MapTo(dep2, (*SpecialString)(nil))

		result, err := injector.Invoke(func(d1 string, d2 SpecialString) string {
			So(d1, ShouldEqual, dep)
			So(d2, ShouldEqual, dep2)
			return "Hello world"
		})

		So(result[0].String(), ShouldEqual, "Hello world")
		So(err, ShouldBeNil)
	})
}

func Test_Injector_Apply(t *testing.T) {
	Convey("Apply a type", t, func() {
		injector := inject.New()
		So(injector, ShouldNotBeNil)

		injector.Map("a dep").MapTo("another dep", (*SpecialString)(nil))

		s := TestStruct{}
		So(injector.Apply(&s), ShouldBeNil)

		So(s.Dep1, ShouldEqual, "a dep")
		So(s.Dep2, ShouldEqual, "another dep")
	})
}

func Test_Injector_InterfaceOf(t *testing.T) {
	Convey("Check interface of a type", t, func() {
		iType := inject.InterfaceOf((*SpecialString)(nil))
		So(iType.Kind(), ShouldEqual, reflect.Interface)

		iType = inject.InterfaceOf((**SpecialString)(nil))
		So(iType.Kind(), ShouldEqual, reflect.Interface)

		defer func() {
			So(recover(), ShouldNotBeNil)
		}()
		iType = inject.InterfaceOf((*testing.T)(nil))
	})
}

func Test_Injector_Set(t *testing.T) {
	Convey("Set and get type", t, func() {
		injector := inject.New()
		So(injector, ShouldNotBeNil)

		typ := reflect.TypeOf("string")
		typSend := reflect.ChanOf(reflect.SendDir, typ)
		typRecv := reflect.ChanOf(reflect.RecvDir, typ)

		// instantiating unidirectional channels is not possible using reflect
		// http://golang.org/src/pkg/reflect/value.go?s=60463:60504#L2064
		chanRecv := reflect.MakeChan(reflect.ChanOf(reflect.BothDir, typ), 0)
		chanSend := reflect.MakeChan(reflect.ChanOf(reflect.BothDir, typ), 0)

		injector.Set(typSend, chanSend)
		injector.Set(typRecv, chanRecv)

		So(injector.GetVal(typSend).IsValid(), ShouldBeTrue)
		So(injector.GetVal(typRecv).IsValid(), ShouldBeTrue)
		So(injector.GetVal(chanSend.Type()).IsValid(), ShouldBeFalse)
	})
}

func Test_Injector_GetVal(t *testing.T) {
	Convey("Map and get type", t, func() {
		injector := inject.New()
		So(injector, ShouldNotBeNil)

		injector.Map("some dependency")

		So(injector.GetVal(reflect.TypeOf("string")).IsValid(), ShouldBeTrue)
		So(injector.GetVal(reflect.TypeOf(11)).IsValid(), ShouldBeFalse)
	})
}

func Test_Injector_SetParent(t *testing.T) {
	Convey("Set parent of injector", t, func() {
		injector := inject.New()
		So(injector, ShouldNotBeNil)

		injector.MapTo("another dep", (*SpecialString)(nil))

		injector2 := inject.New()
		So(injector, ShouldNotBeNil)

		injector2.SetParent(injector)

		So(injector2.GetVal(inject.InterfaceOf((*SpecialString)(nil))).IsValid(), ShouldBeTrue)
	})
}

func Test_Injector_Implementors(t *testing.T) {
	Convey("Check implementors", t, func() {
		injector := inject.New()
		So(injector, ShouldNotBeNil)

		g := &Greeter{"Jeremy"}
		injector.Map(g)

		So(injector.GetVal(inject.InterfaceOf((*fmt.Stringer)(nil))).IsValid(), ShouldBeTrue)
	})
}

func Test_FastInvoker(t *testing.T) {
	Convey("Check fast invoker", t, func() {
		So(inject.IsFastInvoker(myFastInvoker(nil)), ShouldBeTrue)
	})
}

//----------Benchmark InjectorInvoke-------------

func f1InjectorInvoke(d1 string, d2 SpecialString) string {
	return "f1"
}
func f2InjectorInvoke(d1 string, d2 SpecialString) string {
	return "f2"
}

func f1SimpleInjectorInvoke() {
}
func f2SimpleInjectorInvoke() {
}

// f2InjectorInvokeHandler f2 Invoke Handler
type f2InjectorInvokeHandler func(d1 string, d2 SpecialString) string

func (f2 f2InjectorInvokeHandler) Invoke(p []interface{}) ([]reflect.Value, error) {
	ret := f2(p[0].(string), p[1].(SpecialString))
	return []reflect.Value{reflect.ValueOf(ret)}, nil
}

type f2SimpleInjectorInvokeHandler func()

func (f2 f2SimpleInjectorInvokeHandler) Invoke(p []interface{}) ([]reflect.Value, error) {
	f2()
	return nil, nil
}

func BenchmarkInjectorInvokeNative(b *testing.B) {
	b.StopTimer()
	dep := "some dependency"
	dep2 := "another dep"
	var d2 SpecialString
	d2 = dep2

	b.StartTimer()
	for i := 0; i < b.N; i++ {
		f1InjectorInvoke(dep, d2)
	}
}

func BenchmarkInjectorInvokeOriginal(b *testing.B) {
	benchmarkInjectorInvoke(b, false, false)
}

func BenchmarkInjectorInvokeFast(b *testing.B) {
	benchmarkInjectorInvoke(b, true, false)
}

func BenchmarkInjectorInvokeOriginalSimple(b *testing.B) {
	benchmarkInjectorInvoke(b, false, true)
}

func BenchmarkInjectorInvokeFastSimple(b *testing.B) {
	benchmarkInjectorInvoke(b, true, true)
}

func benchmarkInjectorInvoke(b *testing.B, isFast, isSimple bool) {
	b.StopTimer()

	injector := inject.New()
	dep := "some dependency"
	injector.Map(dep)
	dep2 := "another dep"
	injector.MapTo(dep2, (*SpecialString)(nil))

	var f1, f2 interface{}
	if isSimple { //func()
		f1 = f1SimpleInjectorInvoke
		f2 = f2SimpleInjectorInvokeHandler(f2SimpleInjectorInvoke)
	} else { //func(p1, p2) ret
		f1 = f1InjectorInvoke
		f2 = f2InjectorInvokeHandler(f2InjectorInvoke)
	}
	injector.Invoke(f1)
	injector.Invoke(f2)

	b.StartTimer()
	for i := 0; i < b.N; i++ {
		if isFast {
			injector.Invoke(f2)
		} else {
			injector.Invoke(f1)
		}
	}
}

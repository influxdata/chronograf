// Copyright 2015 com authors
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

package com

import (
	"math"
	"math/rand"
	"testing"

	. "github.com/smartystreets/goconvey/convey"
)

func Test_Pow(t *testing.T) {
	Convey("Power int", t, func() {
		for x := 0; x < 10; x++ {
			for y := 0; y < 8; y++ {
				result := PowInt(x, y)
				result_float := math.Pow(float64(x), float64(y))
				So(result, ShouldEqual, int(result_float))
			}
		}
	})
}

func BenchmarkPow(b *testing.B) {
	x := rand.Intn(100)
	y := rand.Intn(6)
	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		PowInt(x, y)
	}
}

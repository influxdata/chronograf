package filestore_test

import (
	"context"
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"testing"

	"github.com/hws522/chronograf"
	"github.com/hws522/chronograf/filestore"
	"github.com/hws522/chronograf/mocks"
	"github.com/stretchr/testify/require"
)

type dashAllTest struct {
	boards []string
	err    bool
}

func TestDashboardsAll(t *testing.T) {
	var tests = []dashAllTest{
		{
			boards: []string{
				`{
	"id": 1,
	"cells": [],
	"templates": [],
	"name": "test-int-id",
	"organization": "default"
}`,
				`{
	"id": "2",
	"cells": [],
	"templates": [],
	"name": "test-string-id",
	"organization": "default"
}`,
			},
			err: false,
		},
		{
			boards: []string{
				`{
	"id": "abc123",
	"cells": [],
	"templates": [],
	"name": "test-string-id",
	"organization": "default"
}`,
			},
			err: true,
		},
	}

	for i, test := range tests {
		testDashboardAll(t, i, test)
	}
}

func testDashboardAll(t *testing.T, i int, test dashAllTest) {
	dir, err := ioutil.TempDir("", "dashboard-all")
	require.NoError(t, err)
	defer os.RemoveAll(dir)

	for j, b := range test.boards {
		require.NoError(t, ioutil.WriteFile(path.Join(dir, fmt.Sprintf("%d-%d.dashboard", i, j)), []byte(b), 0644))
	}

	dboards, err := filestore.NewDashboards(dir, mocks.NewLogger()).All(context.TODO())
	require.NoError(t, err)

	if test.err {
		require.Equal(t, 0, len(dboards))
	} else {
		require.Equal(t, len(test.boards), len(dboards))
	}
}

type dashUpdateTest struct {
	pre  []string
	post []chronograf.Dashboard
	err  bool
}

func TestDashboardsUpdate(t *testing.T) {
	var tests = []dashUpdateTest{
		{
			pre: []string{
				`{
	"id": 1,
	"cells": [],
	"templates": [],
	"name": "test-int-id",
	"organization": "default"
}`,
				`{
	"id": "2",
	"cells": [],
	"templates": [],
	"name": "test-string-id",
	"organization": "default"
}`,
			},
			post: []chronograf.Dashboard{
				{
					ID:           chronograf.DashboardID(1),
					Name:         "test-int-id-1",
					Organization: "default",
				},
				{
					ID:           chronograf.DashboardID(2),
					Name:         "test-string-id-1",
					Organization: "default",
				},
			},
			err: false,
		},
		{
			pre: []string{
				`{
	"id": "abc123",
	"cells": [],
	"templates": [],
	"name": "test-string-id",
	"organization": "default"
}`,
			},
			post: []chronograf.Dashboard{
				{
					ID:           chronograf.DashboardID(1),
					Name:         "test-string-id",
					Organization: "default",
				},
			},
			err: true,
		},
	}

	for i, test := range tests {
		testDashboardUpdate(t, i, test)
	}
}

func testDashboardUpdate(t *testing.T, i int, test dashUpdateTest) {
	dir, err := ioutil.TempDir("", "dashboard-all")
	require.NoError(t, err)
	defer os.RemoveAll(dir)

	for j, b := range test.pre {
		require.NoError(t, ioutil.WriteFile(path.Join(dir, fmt.Sprintf("%d-%d.dashboard", i, j)), []byte(b), 0644))
	}

	dash := filestore.NewDashboards(dir, mocks.NewLogger())
	for _, b := range test.post {
		require.Equal(t, test.err, dash.Update(context.TODO(), b) != nil)
	}

	dboards, err := dash.All(context.TODO())
	require.NoError(t, err)

	if test.err {
		require.Equal(t, 0, len(dboards))
	} else {
		require.Equal(t, len(test.pre), len(dboards))
		require.Equal(t, test.post, dboards)
	}
}

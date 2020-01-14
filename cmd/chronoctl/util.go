package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"strings"
	"text/tabwriter"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/kv"
	"github.com/influxdata/chronograf/kv/bolt"
	"github.com/influxdata/chronograf/mocks"
)

func NewBoltClient(path string) (*bolt.Client, error) {
	c := bolt.NewClient(path, mocks.NewLogger())
	bi := chronograf.BuildInfo{}

	if err := c.Open(context.Background(), bi); err != nil {
		return nil, err
	}

	return c, nil
}

func NewService(s kv.Store) *kv.Service {
	return kv.NewService(mocks.NewLogger(), s)
}

func NewTabWriter() *tabwriter.Writer {
	return tabwriter.NewWriter(os.Stdout, 0, 8, 1, '\t', 0)
}

func WriteHeaders(w io.Writer) {
	fmt.Fprintln(w, "ID\tName\tProvider\tScheme\tSuperAdmin\tOrganization(s)")
}

func WriteUser(w io.Writer, user *chronograf.User) {
	orgs := []string{}
	for _, role := range user.Roles {
		orgs = append(orgs, role.Organization)
	}
	fmt.Fprintf(w, "%d\t%s\t%s\t%s\t%t\t%s\n", user.ID, user.Name, user.Provider, user.Scheme, user.SuperAdmin, strings.Join(orgs, ","))
}

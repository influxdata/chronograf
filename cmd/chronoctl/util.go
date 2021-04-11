package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"strings"
	"text/tabwriter"

	"github.com/hws522/chronograf"
	"github.com/hws522/chronograf/kv"
	"github.com/hws522/chronograf/kv/bolt"
)

func NewBoltClient(path string) (kv.Store, error) {
	return bolt.NewClient(context.TODO(),
		bolt.WithPath(path),
	)
}

func NewService(s kv.Store) (*kv.Service, error) {
	return kv.NewService(context.TODO(), s)
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

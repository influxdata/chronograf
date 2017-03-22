package enterprise

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/influxdata/chronograf"
)

// MetaClient represents a Meta node in an Influx Enterprise cluster
type MetaClient struct {
	URL    *url.URL
	client interface {
		Do(URL *url.URL, path, method string, params map[string]string, body io.Reader) (*http.Response, error)
	}
}

// NewMetaClient represents a meta node in an Influx Enterprise cluster
func NewMetaClient(url *url.URL) *MetaClient {
	return &MetaClient{
		URL:    url,
		client: &defaultClient{},
	}
}

// ShowCluster returns the cluster configuration (not health)
func (m *MetaClient) ShowCluster(ctx context.Context) (*Cluster, error) {
	res, err := m.Do(ctx, "GET", "/show-cluster", nil, nil)
	if err != nil {
		return nil, err
	}

	defer res.Body.Close()
	dec := json.NewDecoder(res.Body)
	out := &Cluster{}
	err = dec.Decode(out)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (m *MetaClient) Databases(ctx context.Context) chronograf.Databases {
	res, _ := m.Do(ctx, "GET", "/databases", nil, nil)

	defer res.Body.Close()
	dec := json.NewDecoder(res.Body)
	dbs := []chronograf.Database{}
	databases := chronograf.Databases{Databases: dbs}
	// _ = dec.Decode(databases)
	return databases
}

// Users gets all the users.  If name is not nil it filters for a single user
func (m *MetaClient) Users(ctx context.Context, name *string) (*Users, error) {
	params := map[string]string{}
	if name != nil {
		params["name"] = *name
	}
	res, err := m.Do(ctx, "GET", "/user", params, nil)
	if err != nil {
		return nil, err
	}

	defer res.Body.Close()
	dec := json.NewDecoder(res.Body)
	users := &Users{}
	err = dec.Decode(users)
	if err != nil {
		return nil, err
	}
	return users, nil
}

// User returns a single Influx Enterprise user
func (m *MetaClient) User(ctx context.Context, name string) (*User, error) {
	users, err := m.Users(ctx, &name)
	if err != nil {
		return nil, err
	}

	for _, user := range users.Users {
		return &user, nil
	}
	return nil, fmt.Errorf("No user found")
}

// CreateUser adds a user to Influx Enterprise
func (m *MetaClient) CreateUser(ctx context.Context, name, passwd string) error {
	return m.CreateUpdateUser(ctx, "create", name, passwd)
}

// ChangePassword updates a user's password in Influx Enterprise
func (m *MetaClient) ChangePassword(ctx context.Context, name, passwd string) error {
	return m.CreateUpdateUser(ctx, "change-password", name, passwd)
}

// CreateUpdateUser is a helper function to POST to the /user Influx Enterprise endpoint
func (m *MetaClient) CreateUpdateUser(ctx context.Context, action, name, passwd string) error {
	a := &UserAction{
		Action: action,
		User: &User{
			Name:     name,
			Password: passwd,
		},
	}
	return m.Post(ctx, "/user", a, nil)
}

// DeleteUser removes a user from Influx Enterprise
func (m *MetaClient) DeleteUser(ctx context.Context, name string) error {
	a := &UserAction{
		Action: "delete",
		User: &User{
			Name: name,
		},
	}

	return m.Post(ctx, "/user", a, nil)
}

// RemoveAllUserPerms revokes all permissions for a user in Influx Enterprise
func (m *MetaClient) RemoveAllUserPerms(ctx context.Context, name string) error {
	user, err := m.User(ctx, name)
	if err != nil {
		return err
	}

	// No permissions to remove
	if len(user.Permissions) == 0 {
		return nil
	}

	a := &UserAction{
		Action: "remove-permissions",
		User:   user,
	}
	return m.Post(ctx, "/user", a, nil)
}

// SetUserPerms removes all permissions and then adds the requested perms
func (m *MetaClient) SetUserPerms(ctx context.Context, name string, perms Permissions) error {
	err := m.RemoveAllUserPerms(ctx, name)
	if err != nil {
		return err
	}

	// No permissions to add, so, user is in the right state
	if len(perms) == 0 {
		return nil
	}

	a := &UserAction{
		Action: "add-permissions",
		User: &User{
			Name:        name,
			Permissions: perms,
		},
	}
	return m.Post(ctx, "/user", a, nil)
}

// UserRoles returns a map of users to all of their current roles
func (m *MetaClient) UserRoles(ctx context.Context) (map[string]Roles, error) {
	res, err := m.Roles(ctx, nil)
	if err != nil {
		return nil, err
	}

	userRoles := make(map[string]Roles)
	for _, role := range res.Roles {
		for _, u := range role.Users {
			ur, ok := userRoles[u]
			if !ok {
				ur = Roles{}
			}
			ur.Roles = append(ur.Roles, role)
			userRoles[u] = ur
		}
	}
	return userRoles, nil
}

// Roles gets all the roles.  If name is not nil it filters for a single role
func (m *MetaClient) Roles(ctx context.Context, name *string) (*Roles, error) {
	params := map[string]string{}
	if name != nil {
		params["name"] = *name
	}
	res, err := m.Do(ctx, "GET", "/role", params, nil)
	if err != nil {
		return nil, err
	}

	defer res.Body.Close()
	dec := json.NewDecoder(res.Body)
	roles := &Roles{}
	err = dec.Decode(roles)
	if err != nil {
		return nil, err
	}
	return roles, nil
}

// Role returns a single named role
func (m *MetaClient) Role(ctx context.Context, name string) (*Role, error) {
	roles, err := m.Roles(ctx, &name)
	if err != nil {
		return nil, err
	}
	for _, role := range roles.Roles {
		return &role, nil
	}
	return nil, fmt.Errorf("No role found")
}

// CreateRole adds a role to Influx Enterprise
func (m *MetaClient) CreateRole(ctx context.Context, name string) error {
	a := &RoleAction{
		Action: "create",
		Role: &Role{
			Name: name,
		},
	}
	return m.Post(ctx, "/role", a, nil)
}

// DeleteRole removes a role from Influx Enterprise
func (m *MetaClient) DeleteRole(ctx context.Context, name string) error {
	a := &RoleAction{
		Action: "delete",
		Role: &Role{
			Name: name,
		},
	}
	return m.Post(ctx, "/role", a, nil)
}

// RemoveAllRolePerms removes all permissions from a role
func (m *MetaClient) RemoveAllRolePerms(ctx context.Context, name string) error {
	role, err := m.Role(ctx, name)
	if err != nil {
		return err
	}

	// No permissions to remove
	if len(role.Permissions) == 0 {
		return nil
	}

	a := &RoleAction{
		Action: "remove-permissions",
		Role:   role,
	}
	return m.Post(ctx, "/role", a, nil)
}

// SetRolePerms removes all permissions and then adds the requested perms to role
func (m *MetaClient) SetRolePerms(ctx context.Context, name string, perms Permissions) error {
	err := m.RemoveAllRolePerms(ctx, name)
	if err != nil {
		return err
	}

	// No permissions to add, so, role is in the right state
	if len(perms) == 0 {
		return nil
	}

	a := &RoleAction{
		Action: "add-permissions",
		Role: &Role{
			Name:        name,
			Permissions: perms,
		},
	}
	return m.Post(ctx, "/role", a, nil)
}

// SetRoleUsers removes all users and then adds the requested users to role
func (m *MetaClient) SetRoleUsers(ctx context.Context, name string, users []string) error {
	role, err := m.Role(ctx, name)
	if err != nil {
		return err
	}
	revoke, add := Difference(users, role.Users)
	if err := m.RemoveRoleUsers(ctx, name, revoke); err != nil {
		return err
	}

	return m.AddRoleUsers(ctx, name, add)
}

// Difference compares two sets and returns a set to be removed and a set to be added
func Difference(wants []string, haves []string) (revoke []string, add []string) {
	for _, want := range wants {
		found := false
		for _, got := range haves {
			if want != got {
				continue
			}
			found = true
		}
		if !found {
			add = append(add, want)
		}
	}
	for _, got := range haves {
		found := false
		for _, want := range wants {
			if want != got {
				continue
			}
			found = true
			break
		}
		if !found {
			revoke = append(revoke, got)
		}
	}
	return
}

// AddRoleUsers updates a role to have additional users.
func (m *MetaClient) AddRoleUsers(ctx context.Context, name string, users []string) error {
	// No permissions to add, so, role is in the right state
	if len(users) == 0 {
		return nil
	}

	a := &RoleAction{
		Action: "add-users",
		Role: &Role{
			Name:  name,
			Users: users,
		},
	}
	return m.Post(ctx, "/role", a, nil)
}

// RemoveRoleUsers updates a role to remove some users.
func (m *MetaClient) RemoveRoleUsers(ctx context.Context, name string, users []string) error {
	// No permissions to add, so, role is in the right state
	if len(users) == 0 {
		return nil
	}

	a := &RoleAction{
		Action: "remove-users",
		Role: &Role{
			Name:  name,
			Users: users,
		},
	}
	return m.Post(ctx, "/role", a, nil)
}

// Post is a helper function to POST to Influx Enterprise
func (m *MetaClient) Post(ctx context.Context, path string, action interface{}, params map[string]string) error {
	b, err := json.Marshal(action)
	if err != nil {
		return err
	}
	body := bytes.NewReader(b)
	_, err = m.Do(ctx, "POST", path, params, body)
	if err != nil {
		return err
	}
	return nil
}

type defaultClient struct{}

// Do is a helper function to interface with Influx Enterprise's Meta API
func (d *defaultClient) Do(URL *url.URL, path, method string, params map[string]string, body io.Reader) (*http.Response, error) {
	p := url.Values{}
	for k, v := range params {
		p.Add(k, v)
	}

	URL.Path = path
	URL.RawQuery = p.Encode()

	req, err := http.NewRequest(method, URL.String(), body)
	if err != nil {
		return nil, err
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}

	if res.StatusCode != http.StatusOK {
		defer res.Body.Close()
		dec := json.NewDecoder(res.Body)
		out := &Error{}
		err = dec.Decode(out)
		if err != nil {
			return nil, err
		}
		return nil, errors.New(out.Error)
	}

	return res, nil

}

// Do is a cancelable function to interface with Influx Enterprise's Meta API
func (m *MetaClient) Do(ctx context.Context, method, path string, params map[string]string, body io.Reader) (*http.Response, error) {
	type result struct {
		Response *http.Response
		Err      error
	}
	resps := make(chan (result))
	go func() {
		resp, err := m.client.Do(m.URL, path, method, params, body)
		resps <- result{resp, err}
	}()

	select {
	case resp := <-resps:
		return resp.Response, resp.Err
	case <-ctx.Done():
		return nil, chronograf.ErrUpstreamTimeout
	}
}

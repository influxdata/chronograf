package internal

import (
	"encoding/json"
	"fmt"

	"github.com/gogo/protobuf/proto"
	"github.com/influxdata/chronograf"
)

//go:generate protoc --gogo_out=. internal.proto

// MarshalBuild encodes a build to binary protobuf format.
func MarshalBuild(b chronograf.BuildInfo) ([]byte, error) {
	return proto.Marshal(&BuildInfo{
		Version: b.Version,
		Commit:  b.Commit,
	})
}

// UnmarshalBuild decodes a build from binary protobuf data.
func UnmarshalBuild(data []byte, b *chronograf.BuildInfo) error {
	var pb BuildInfo
	if err := proto.Unmarshal(data, &pb); err != nil {
		return err
	}

	b.Version = pb.Version
	b.Commit = pb.Commit
	return nil
}

// MarshalSource encodes a source to binary protobuf format.
func MarshalSource(s chronograf.Source) ([]byte, error) {
	return proto.Marshal(&Source{
		ID:                 int64(s.ID),
		Name:               s.Name,
		Type:               s.Type,
		Username:           s.Username,
		Password:           s.Password,
		SharedSecret:       s.SharedSecret,
		URL:                s.URL,
		MetaURL:            s.MetaURL,
		InsecureSkipVerify: s.InsecureSkipVerify,
		Default:            s.Default,
		Telegraf:           s.Telegraf,
		Organization:       s.Organization,
		Role:               s.Role,
	})
}

// UnmarshalSource decodes a source from binary protobuf data.
func UnmarshalSource(data []byte, s *chronograf.Source) error {
	var pb Source
	if err := proto.Unmarshal(data, &pb); err != nil {
		return err
	}

	s.ID = int(pb.ID)
	s.Name = pb.Name
	s.Type = pb.Type
	s.Username = pb.Username
	s.Password = pb.Password
	s.SharedSecret = pb.SharedSecret
	s.URL = pb.URL
	s.MetaURL = pb.MetaURL
	s.InsecureSkipVerify = pb.InsecureSkipVerify
	s.Default = pb.Default
	s.Telegraf = pb.Telegraf
	s.Organization = pb.Organization
	s.Role = pb.Role
	return nil
}

// MarshalServer encodes a server to binary protobuf format.
func MarshalServer(s chronograf.Server) ([]byte, error) {
	return proto.Marshal(&Server{
		ID:                 int64(s.ID),
		SrcID:              int64(s.SrcID),
		Name:               s.Name,
		Username:           s.Username,
		Password:           s.Password,
		URL:                s.URL,
		Active:             s.Active,
		Organization:       s.Organization,
		InsecureSkipVerify: s.InsecureSkipVerify,
	})
}

// UnmarshalServer decodes a server from binary protobuf data.
func UnmarshalServer(data []byte, s *chronograf.Server) error {
	var pb Server
	if err := proto.Unmarshal(data, &pb); err != nil {
		return err
	}

	s.ID = int(pb.ID)
	s.SrcID = int(pb.SrcID)
	s.Name = pb.Name
	s.Username = pb.Username
	s.Password = pb.Password
	s.URL = pb.URL
	s.Active = pb.Active
	s.Organization = pb.Organization
	s.InsecureSkipVerify = pb.InsecureSkipVerify
	return nil
}

// MarshalLayout encodes a layout to binary protobuf format.
func MarshalLayout(l chronograf.Layout) ([]byte, error) {
	cells := make([]*Cell, len(l.Cells))
	for i, c := range l.Cells {
		queries := make([]*Query, len(c.Queries))
		for j, q := range c.Queries {
			r := new(Range)
			if q.Range != nil {
				r.Upper, r.Lower = q.Range.Upper, q.Range.Lower
			}
			queries[j] = &Query{
				Command:  q.Command,
				DB:       q.DB,
				RP:       q.RP,
				GroupBys: q.GroupBys,
				Wheres:   q.Wheres,
				Label:    q.Label,
				Range:    r,
			}
		}

		axes := make(map[string]*Axis, len(c.Axes))
		for a, r := range c.Axes {
			axes[a] = &Axis{
				Bounds: r.Bounds,
				Label:  r.Label,
			}
		}

		cells[i] = &Cell{
			X:       c.X,
			Y:       c.Y,
			W:       c.W,
			H:       c.H,
			I:       c.I,
			Name:    c.Name,
			Queries: queries,
			Type:    c.Type,
			Axes:    axes,
		}
	}
	return proto.Marshal(&Layout{
		ID:          l.ID,
		Measurement: l.Measurement,
		Application: l.Application,
		Autoflow:    l.Autoflow,
		Cells:       cells,
	})
}

// UnmarshalLayout decodes a layout from binary protobuf data.
func UnmarshalLayout(data []byte, l *chronograf.Layout) error {
	var pb Layout
	if err := proto.Unmarshal(data, &pb); err != nil {
		return err
	}

	l.ID = pb.ID
	l.Measurement = pb.Measurement
	l.Application = pb.Application
	l.Autoflow = pb.Autoflow
	cells := make([]chronograf.Cell, len(pb.Cells))
	for i, c := range pb.Cells {
		queries := make([]chronograf.Query, len(c.Queries))
		for j, q := range c.Queries {
			queries[j] = chronograf.Query{
				Command:  q.Command,
				DB:       q.DB,
				RP:       q.RP,
				GroupBys: q.GroupBys,
				Wheres:   q.Wheres,
				Label:    q.Label,
			}
			if q.Range.Upper != q.Range.Lower {
				queries[j].Range = &chronograf.Range{
					Upper: q.Range.Upper,
					Lower: q.Range.Lower,
				}
			}
		}
		axes := make(map[string]chronograf.Axis, len(c.Axes))
		for a, r := range c.Axes {
			axes[a] = chronograf.Axis{
				Bounds: r.Bounds,
				Label:  r.Label,
			}
		}

		cells[i] = chronograf.Cell{
			X:       c.X,
			Y:       c.Y,
			W:       c.W,
			H:       c.H,
			I:       c.I,
			Name:    c.Name,
			Queries: queries,
			Type:    c.Type,
			Axes:    axes,
		}
	}
	l.Cells = cells
	return nil
}

// MarshalDashboard encodes a dashboard to binary protobuf format.
func MarshalDashboard(d chronograf.Dashboard) ([]byte, error) {
	cells := make([]*DashboardCell, len(d.Cells))
	for i, c := range d.Cells {
		queries := make([]*Query, len(c.Queries))
		for j, q := range c.Queries {
			r := new(Range)
			if q.Range != nil {
				r.Upper, r.Lower = q.Range.Upper, q.Range.Lower
			}
			q.Shifts = q.QueryConfig.Shifts
			queries[j] = &Query{
				Command: q.Command,
				Label:   q.Label,
				Range:   r,
				Source:  q.Source,
			}

			shifts := make([]*TimeShift, len(q.Shifts))
			for k := range q.Shifts {
				shift := &TimeShift{
					Label:    q.Shifts[k].Label,
					Unit:     q.Shifts[k].Unit,
					Quantity: q.Shifts[k].Quantity,
				}

				shifts[k] = shift
			}

			queries[j].Shifts = shifts
		}

		colors := make([]*Color, len(c.CellColors))
		for j, color := range c.CellColors {
			colors[j] = &Color{
				ID:    color.ID,
				Type:  color.Type,
				Hex:   color.Hex,
				Name:  color.Name,
				Value: color.Value,
			}
		}

		axes := make(map[string]*Axis, len(c.Axes))
		for a, r := range c.Axes {
			axes[a] = &Axis{
				Bounds: r.Bounds,
				Label:  r.Label,
				Prefix: r.Prefix,
				Suffix: r.Suffix,
				Base:   r.Base,
				Scale:  r.Scale,
			}
		}

		sortBy := &RenamableField{
			InternalName: c.TableOptions.SortBy.InternalName,
			DisplayName:  c.TableOptions.SortBy.DisplayName,
			Visible:      c.TableOptions.SortBy.Visible,
		}

		fieldNames := make([]*RenamableField, len(c.TableOptions.FieldNames))
		for i, field := range c.TableOptions.FieldNames {
			fieldNames[i] = &RenamableField{
				InternalName: field.InternalName,
				DisplayName:  field.DisplayName,
				Visible:      field.Visible,
			}
		}

		tableOptions := &TableOptions{
			TimeFormat:       c.TableOptions.TimeFormat,
			VerticalTimeAxis: c.TableOptions.VerticalTimeAxis,
			SortBy:           sortBy,
			Wrapping:         c.TableOptions.Wrapping,
			FieldNames:       fieldNames,
			FixFirstColumn:   c.TableOptions.FixFirstColumn,
		}

		cells[i] = &DashboardCell{
			ID:      c.ID,
			X:       c.X,
			Y:       c.Y,
			W:       c.W,
			H:       c.H,
			Name:    c.Name,
			Queries: queries,
			Type:    c.Type,
			Axes:    axes,
			Colors:  colors,
			Legend: &Legend{
				Type:        c.Legend.Type,
				Orientation: c.Legend.Orientation,
			},
			TableOptions: tableOptions,
		}
	}
	templates := make([]*Template, len(d.Templates))
	for i, t := range d.Templates {
		vals := make([]*TemplateValue, len(t.Values))
		for j, v := range t.Values {
			vals[j] = &TemplateValue{
				Selected: v.Selected,
				Type:     v.Type,
				Value:    v.Value,
			}
		}

		template := &Template{
			ID:      string(t.ID),
			TempVar: t.Var,
			Values:  vals,
			Type:    t.Type,
			Label:   t.Label,
		}
		if t.Query != nil {
			template.Query = &TemplateQuery{
				Command:     t.Query.Command,
				Db:          t.Query.DB,
				Rp:          t.Query.RP,
				Measurement: t.Query.Measurement,
				TagKey:      t.Query.TagKey,
				FieldKey:    t.Query.FieldKey,
			}
		}
		templates[i] = template
	}
	return proto.Marshal(&Dashboard{
		ID:           int64(d.ID),
		Cells:        cells,
		Templates:    templates,
		Name:         d.Name,
		Organization: d.Organization,
	})
}

// UnmarshalDashboard decodes a layout from binary protobuf data.
func UnmarshalDashboard(data []byte, d *chronograf.Dashboard) error {
	var pb Dashboard
	if err := proto.Unmarshal(data, &pb); err != nil {
		return err
	}

	cells := make([]chronograf.DashboardCell, len(pb.Cells))
	for i, c := range pb.Cells {
		queries := make([]chronograf.DashboardQuery, len(c.Queries))
		for j, q := range c.Queries {
			queries[j] = chronograf.DashboardQuery{
				Command: q.Command,
				Label:   q.Label,
				Source:  q.Source,
			}

			if q.Range.Upper != q.Range.Lower {
				queries[j].Range = &chronograf.Range{
					Upper: q.Range.Upper,
					Lower: q.Range.Lower,
				}
			}

			shifts := make([]chronograf.TimeShift, len(q.Shifts))
			for k := range q.Shifts {
				shift := chronograf.TimeShift{
					Label:    q.Shifts[k].Label,
					Unit:     q.Shifts[k].Unit,
					Quantity: q.Shifts[k].Quantity,
				}

				shifts[k] = shift
			}

			queries[j].Shifts = shifts
		}

		colors := make([]chronograf.CellColor, len(c.Colors))
		for j, color := range c.Colors {
			colors[j] = chronograf.CellColor{
				ID:    color.ID,
				Type:  color.Type,
				Hex:   color.Hex,
				Name:  color.Name,
				Value: color.Value,
			}
		}

		axes := make(map[string]chronograf.Axis, len(c.Axes))
		for a, r := range c.Axes {
			// axis base defaults to 10
			if r.Base == "" {
				r.Base = "10"
			}

			if r.Scale == "" {
				r.Scale = "linear"
			}

			if r.Bounds != nil {
				axes[a] = chronograf.Axis{
					Bounds: r.Bounds,
					Label:  r.Label,
					Prefix: r.Prefix,
					Suffix: r.Suffix,
					Base:   r.Base,
					Scale:  r.Scale,
				}

			} else {
				axes[a] = chronograf.Axis{
					Bounds: []string{},
					Base:   r.Base,
					Scale:  r.Scale,
				}
			}
		}

		legend := chronograf.Legend{}
		if c.Legend != nil {
			legend.Type = c.Legend.Type
			legend.Orientation = c.Legend.Orientation
		}

		tableOptions := chronograf.TableOptions{}
		if c.TableOptions != nil {
			sortBy := chronograf.RenamableField{}
			if c.TableOptions.SortBy != nil {
				sortBy.InternalName = c.TableOptions.SortBy.InternalName
				sortBy.DisplayName = c.TableOptions.SortBy.DisplayName
				sortBy.Visible = c.TableOptions.SortBy.Visible
			}
			tableOptions.SortBy = sortBy

			fieldNames := make([]chronograf.RenamableField, len(c.TableOptions.FieldNames))
			for i, field := range c.TableOptions.FieldNames {
				fieldNames[i] = chronograf.RenamableField{}
				fieldNames[i].InternalName = field.InternalName
				fieldNames[i].DisplayName = field.DisplayName
				fieldNames[i].Visible = field.Visible
			}
			tableOptions.FieldNames = fieldNames
			tableOptions.TimeFormat = c.TableOptions.TimeFormat
			tableOptions.VerticalTimeAxis = c.TableOptions.VerticalTimeAxis
			tableOptions.Wrapping = c.TableOptions.Wrapping
			tableOptions.FixFirstColumn = c.TableOptions.FixFirstColumn

		}

		// FIXME: this is merely for legacy cells and
		//        should be removed as soon as possible
		cellType := c.Type
		if cellType == "" {
			cellType = "line"
		}

		cells[i] = chronograf.DashboardCell{
			ID:           c.ID,
			X:            c.X,
			Y:            c.Y,
			W:            c.W,
			H:            c.H,
			Name:         c.Name,
			Queries:      queries,
			Type:         cellType,
			Axes:         axes,
			CellColors:   colors,
			Legend:       legend,
			TableOptions: tableOptions,
		}
	}

	templates := make([]chronograf.Template, len(pb.Templates))
	for i, t := range pb.Templates {
		vals := make([]chronograf.TemplateValue, len(t.Values))
		for j, v := range t.Values {
			vals[j] = chronograf.TemplateValue{
				Selected: v.Selected,
				Type:     v.Type,
				Value:    v.Value,
			}
		}

		template := chronograf.Template{
			ID: chronograf.TemplateID(t.ID),
			TemplateVar: chronograf.TemplateVar{
				Var:    t.TempVar,
				Values: vals,
			},
			Type:  t.Type,
			Label: t.Label,
		}

		if t.Query != nil {
			template.Query = &chronograf.TemplateQuery{
				Command:     t.Query.Command,
				DB:          t.Query.Db,
				RP:          t.Query.Rp,
				Measurement: t.Query.Measurement,
				TagKey:      t.Query.TagKey,
				FieldKey:    t.Query.FieldKey,
			}
		}
		templates[i] = template
	}

	d.ID = chronograf.DashboardID(pb.ID)
	d.Cells = cells
	d.Templates = templates
	d.Name = pb.Name
	d.Organization = pb.Organization
	return nil
}

// ScopedAlert contains the source and the kapacitor id
type ScopedAlert struct {
	chronograf.AlertRule
	SrcID  int
	KapaID int
}

// MarshalAlertRule encodes an alert rule to binary protobuf format.
func MarshalAlertRule(r *ScopedAlert) ([]byte, error) {
	j, err := json.Marshal(r.AlertRule)
	if err != nil {
		return nil, err
	}
	return proto.Marshal(&AlertRule{
		ID:     r.ID,
		SrcID:  int64(r.SrcID),
		KapaID: int64(r.KapaID),
		JSON:   string(j),
	})
}

// UnmarshalAlertRule decodes an alert rule from binary protobuf data.
func UnmarshalAlertRule(data []byte, r *ScopedAlert) error {
	var pb AlertRule
	if err := proto.Unmarshal(data, &pb); err != nil {
		return err
	}

	err := json.Unmarshal([]byte(pb.JSON), &r.AlertRule)
	if err != nil {
		return err
	}
	r.SrcID = int(pb.SrcID)
	r.KapaID = int(pb.KapaID)
	return nil
}

// MarshalUser encodes a user to binary protobuf format.
// We are ignoring the password for now.
func MarshalUser(u *chronograf.User) ([]byte, error) {
	roles := make([]*Role, len(u.Roles))
	for i, role := range u.Roles {
		roles[i] = &Role{
			Organization: role.Organization,
			Name:         role.Name,
		}
	}
	return MarshalUserPB(&User{
		ID:         u.ID,
		Name:       u.Name,
		Provider:   u.Provider,
		Scheme:     u.Scheme,
		Roles:      roles,
		SuperAdmin: u.SuperAdmin,
	})
}

// MarshalUserPB encodes a user to binary protobuf format.
// We are ignoring the password for now.
func MarshalUserPB(u *User) ([]byte, error) {
	return proto.Marshal(u)
}

// UnmarshalUser decodes a user from binary protobuf data.
// We are ignoring the password for now.
func UnmarshalUser(data []byte, u *chronograf.User) error {
	var pb User
	if err := UnmarshalUserPB(data, &pb); err != nil {
		return err
	}
	roles := make([]chronograf.Role, len(pb.Roles))
	for i, role := range pb.Roles {
		roles[i] = chronograf.Role{
			Organization: role.Organization,
			Name:         role.Name,
		}
	}
	u.ID = pb.ID
	u.Name = pb.Name
	u.Provider = pb.Provider
	u.Scheme = pb.Scheme
	u.SuperAdmin = pb.SuperAdmin
	u.Roles = roles

	return nil
}

// UnmarshalUserPB decodes a user from binary protobuf data.
// We are ignoring the password for now.
func UnmarshalUserPB(data []byte, u *User) error {
	return proto.Unmarshal(data, u)
}

// MarshalRole encodes a role to binary protobuf format.
func MarshalRole(r *chronograf.Role) ([]byte, error) {
	return MarshalRolePB(&Role{
		Organization: r.Organization,
		Name:         r.Name,
	})
}

// MarshalRolePB encodes a role to binary protobuf format.
func MarshalRolePB(r *Role) ([]byte, error) {
	return proto.Marshal(r)
}

// UnmarshalRole decodes a role from binary protobuf data.
func UnmarshalRole(data []byte, r *chronograf.Role) error {
	var pb Role
	if err := UnmarshalRolePB(data, &pb); err != nil {
		return err
	}
	r.Organization = pb.Organization
	r.Name = pb.Name

	return nil
}

// UnmarshalRolePB decodes a role from binary protobuf data.
func UnmarshalRolePB(data []byte, r *Role) error {
	return proto.Unmarshal(data, r)
}

// MarshalOrganization encodes a organization to binary protobuf format.
func MarshalOrganization(o *chronograf.Organization) ([]byte, error) {

	return MarshalOrganizationPB(&Organization{
		ID:          o.ID,
		Name:        o.Name,
		DefaultRole: o.DefaultRole,
	})
}

// MarshalOrganizationPB encodes a organization to binary protobuf format.
func MarshalOrganizationPB(o *Organization) ([]byte, error) {
	return proto.Marshal(o)
}

// UnmarshalOrganization decodes a organization from binary protobuf data.
func UnmarshalOrganization(data []byte, o *chronograf.Organization) error {
	var pb Organization
	if err := UnmarshalOrganizationPB(data, &pb); err != nil {
		return err
	}
	o.ID = pb.ID
	o.Name = pb.Name
	o.DefaultRole = pb.DefaultRole

	return nil
}

// UnmarshalOrganizationPB decodes a organization from binary protobuf data.
func UnmarshalOrganizationPB(data []byte, o *Organization) error {
	return proto.Unmarshal(data, o)
}

// MarshalConfig encodes a config to binary protobuf format.
func MarshalConfig(c *chronograf.Config) ([]byte, error) {
	return MarshalConfigPB(&Config{
		Auth: &AuthConfig{
			SuperAdminNewUsers: c.Auth.SuperAdminNewUsers,
		},
	})
}

// MarshalConfigPB encodes a config to binary protobuf format.
func MarshalConfigPB(c *Config) ([]byte, error) {
	return proto.Marshal(c)
}

// UnmarshalConfig decodes a config from binary protobuf data.
func UnmarshalConfig(data []byte, c *chronograf.Config) error {
	var pb Config
	if err := UnmarshalConfigPB(data, &pb); err != nil {
		return err
	}
	if pb.Auth == nil {
		return fmt.Errorf("Auth config is nil")
	}
	c.Auth.SuperAdminNewUsers = pb.Auth.SuperAdminNewUsers

	return nil
}

// UnmarshalConfigPB decodes a config from binary protobuf data.
func UnmarshalConfigPB(data []byte, c *Config) error {
	return proto.Unmarshal(data, c)
}

// MarshalMapping encodes a mapping to binary protobuf format.
func MarshalMapping(m *chronograf.Mapping) ([]byte, error) {

	return MarshalMappingPB(&Mapping{
		Provider:             m.Provider,
		Scheme:               m.Scheme,
		ProviderOrganization: m.ProviderOrganization,
		ID:                   m.ID,
		Organization:         m.Organization,
	})
}

// MarshalMappingPB encodes a mapping to binary protobuf format.
func MarshalMappingPB(m *Mapping) ([]byte, error) {
	return proto.Marshal(m)
}

// UnmarshalMapping decodes a mapping from binary protobuf data.
func UnmarshalMapping(data []byte, m *chronograf.Mapping) error {
	var pb Mapping
	if err := UnmarshalMappingPB(data, &pb); err != nil {
		return err
	}

	m.Provider = pb.Provider
	m.Scheme = pb.Scheme
	m.ProviderOrganization = pb.ProviderOrganization
	m.Organization = pb.Organization
	m.ID = pb.ID

	return nil
}

// UnmarshalMappingPB decodes a mapping from binary protobuf data.
func UnmarshalMappingPB(data []byte, m *Mapping) error {
	return proto.Unmarshal(data, m)
}

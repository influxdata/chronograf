package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/influxdata/chronograf/enterprise"
	"github.com/influxdata/chronograf/flux"

	"github.com/bouk/httprouter"
	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/influx"
)

type sourceLinks struct {
	Self        string `json:"self"`            // Self link mapping to this resource
	Kapacitors  string `json:"kapacitors"`      // URL for kapacitors endpoint
	Services    string `json:"services"`        // URL for services endpoint
	Proxy       string `json:"proxy"`           // URL for proxy endpoint
	Queries     string `json:"queries"`         // URL for the queries analysis endpoint
	Write       string `json:"write"`           // URL for the write line-protocol endpoint
	Permissions string `json:"permissions"`     // URL for all allowed permissions for this source
	Users       string `json:"users"`           // URL for all users associated with this source
	Roles       string `json:"roles,omitempty"` // URL for all users associated with this source
	Databases   string `json:"databases"`       // URL for the databases contained within this source
	Annotations string `json:"annotations"`     // URL for the annotations of this source
	Health      string `json:"health"`          // URL for source health
	Flux        string `json:"flux,omitempty"`  // URL for flux if it exists
}

type sourceResponse struct {
	chronograf.Source
	AuthenticationMethod string      `json:"authentication"`
	Links                sourceLinks `json:"links"`
}

type authenticationResponse struct {
	ID                   int `json:"id,string"`
	AuthenticationMethod string
}

func sourceAuthenticationMethod(ctx context.Context, src chronograf.Source) authenticationResponse {
	ldapEnabled := false
	if src.MetaURL != "" {
		authorizer := influx.DefaultAuthorization(&src)
		metaURL, err := url.Parse(src.MetaURL)

		if err == nil {
			client := enterprise.NewMetaClient(metaURL, src.InsecureSkipVerify, authorizer)
			config, err := client.GetLDAPConfig(ctx)

			if err == nil {
				ldapEnabled = config.Structured.Enabled
			}
		}
	}

	if ldapEnabled {
		return authenticationResponse{ID: src.ID, AuthenticationMethod: "ldap"}
	} else if src.Username != "" && src.Password != "" {
		return authenticationResponse{ID: src.ID, AuthenticationMethod: "basic"}
	} else if src.SharedSecret != "" {
		return authenticationResponse{ID: src.ID, AuthenticationMethod: "shared"}
	} else {
		return authenticationResponse{ID: src.ID, AuthenticationMethod: "unknown"}
	}
}

func hasFlux(ctx context.Context, src chronograf.Source) (bool, error) {
	// flux is always available in v2 version, but it requires v2 Token authentication (distinguished by Type)
	// and a non-empty Organization (stored in Username)
	if src.Version == "" /* v2 OSS reports no version */ || strings.HasPrefix(src.Version, "2.") {
		return src.Type == chronograf.InfluxDBv2 && src.Username != "", nil
	}
	if chronograf.IsV3SrcType(src.Type) {
		// InfluxDB 3 doesn't support Flux.
		return false, nil
	}

	url, err := url.ParseRequestURI(src.URL)
	if err != nil {
		return false, err
	}

	cli := &flux.Client{
		URL:                url,
		InsecureSkipVerify: src.InsecureSkipVerify,
		Timeout:            500 * time.Millisecond,
	}

	return cli.FluxEnabled()
}

func newSourceResponse(ctx context.Context, src chronograf.Source) sourceResponse {
	// If telegraf is not set, we'll set it to the default value.
	if src.Telegraf == "" {
		src.Telegraf = "telegraf"
	}

	authMethod := sourceAuthenticationMethod(ctx, src)

	// Omit the password and shared secret on response
	src.Password = ""
	src.SharedSecret = ""

	httpAPISrcs := "/chronograf/v1/sources"
	res := sourceResponse{
		Source:               src,
		AuthenticationMethod: authMethod.AuthenticationMethod,
		Links: sourceLinks{
			Self:        fmt.Sprintf("%s/%d", httpAPISrcs, src.ID),
			Kapacitors:  fmt.Sprintf("%s/%d/kapacitors", httpAPISrcs, src.ID),
			Services:    fmt.Sprintf("%s/%d/services", httpAPISrcs, src.ID),
			Proxy:       fmt.Sprintf("%s/%d/proxy", httpAPISrcs, src.ID),
			Queries:     fmt.Sprintf("%s/%d/queries", httpAPISrcs, src.ID),
			Write:       fmt.Sprintf("%s/%d/write", httpAPISrcs, src.ID),
			Permissions: fmt.Sprintf("%s/%d/permissions", httpAPISrcs, src.ID),
			Users:       fmt.Sprintf("%s/%d/users", httpAPISrcs, src.ID),
			Databases:   fmt.Sprintf("%s/%d/dbs", httpAPISrcs, src.ID),
			Annotations: fmt.Sprintf("%s/%d/annotations", httpAPISrcs, src.ID),
			Health:      fmt.Sprintf("%s/%d/health", httpAPISrcs, src.ID),
		},
	}

	// we are ignoring the error because the error state means that we'll
	// turn off the flux querying in the frontend anyway.  Is this English?
	// good 'nuf
	isFluxEnabled, _ := hasFlux(ctx, src)
	if isFluxEnabled {
		res.Links.Flux = fmt.Sprintf("%s/%d/proxy/flux", httpAPISrcs, src.ID)
	}

	// MetaURL is currently a string, but eventually, we'd like to change it
	// to a slice. Checking len(src.MetaURL) is functionally equivalent to
	// checking if it is equal to the empty string.
	if src.Type == chronograf.InfluxDBv1Enterprise && len(src.MetaURL) != 0 {
		res.Links.Roles = fmt.Sprintf("%s/%d/roles", httpAPISrcs, src.ID)
	}
	return res
}

// NewSource adds a new valid source to the store
func (s *Service) NewSource(w http.ResponseWriter, r *http.Request) {
	var src chronograf.Source
	if err := json.NewDecoder(r.Body).Decode(&src); err != nil {
		invalidJSON(w, s.Logger)
		return
	}

	ctx := r.Context()
	defaultOrg, err := s.Store.Organizations(ctx).DefaultOrganization(ctx)
	if err != nil {
		unknownErrorWithMessage(w, err, s.Logger)
		return
	}

	if err := ValidSourceRequest(&src, defaultOrg.ID); err != nil {
		invalidData(w, err, s.Logger)
		return
	}

	// By default the telegraf database will be telegraf
	if src.Telegraf == "" {
		src.Telegraf = "telegraf"
	}

	src.Version = s.sourceVersion(ctx, &src)

	dbType, err := s.tsdbType(ctx, &src)
	if err != nil {
		Error(w, http.StatusBadRequest, "Error contacting source", s.Logger)
		return
	}

	if err := s.validateCredentials(ctx, &src); err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}

	src.Type = dbType
	// persist unless it is a dry-run
	if _, dryRun := r.URL.Query()["dryRun"]; !dryRun {
		if src, err = s.Store.Sources(ctx).Add(ctx, src); err != nil {
			msg := fmt.Errorf("Error storing source %v: %v", src, err)
			unknownErrorWithMessage(w, msg, s.Logger)
			return
		}
	}

	res := newSourceResponse(ctx, src)
	location(w, res.Links.Self)
	encodeJSON(w, http.StatusCreated, res, s.Logger)
}

func (s *Service) sourceVersion(ctx context.Context, src *chronograf.Source) string {
	retVal, err := s.tsdbVersion(ctx, src)
	if err == nil {
		return retVal
	}
	s.Logger.WithField("error", err.Error()).WithField("url", src.URL).Info("Failed to retrieve database version")
	if strings.HasPrefix(src.Version, "1.") || strings.HasPrefix(src.Version, "2.") {
		// keep the client version unchanged
		return src.Version
	}
	return "Unknown"
}

func (s *Service) tsdbVersion(ctx context.Context, src *chronograf.Source) (string, error) {
	cli := &influx.Client{
		Logger: s.Logger,
	}

	if err := cli.Connect(ctx, src); err != nil {
		return "", err
	}

	ctx, cancel := context.WithTimeout(ctx, time.Second)
	defer cancel()

	return cli.Version(ctx)
}

func (s *Service) tsdbType(ctx context.Context, src *chronograf.Source) (string, error) {
	if src.Type == chronograf.InfluxDBv2 ||
		src.Type == chronograf.InfluxDBv3Core ||
		src.Type == chronograf.InfluxDBv3Enterprise ||
		src.Type == chronograf.InfluxDBv3Clustered ||
		src.Type == chronograf.InfluxDBv3CloudDedicated {
		return src.Type, nil // type selected by the user
	}
	cli := &influx.Client{
		Logger: s.Logger,
	}

	if err := cli.Connect(ctx, src); err != nil {
		return "", err
	}

	ctx, cancel := context.WithTimeout(ctx, time.Second)
	defer cancel()

	return cli.Type(ctx)
}

func (s *Service) validateCredentials(ctx context.Context, src *chronograf.Source) error {
	cli := &influx.Client{
		Logger: s.Logger,
	}
	if err := cli.Connect(ctx, src); err != nil {
		return err
	}

	return cli.ValidateAuth(ctx, src)
}

type getSourcesResponse struct {
	Sources []sourceResponse `json:"sources"`
}

// Sources returns all sources from the store.
func (s *Service) Sources(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	res := getSourcesResponse{
		Sources: make([]sourceResponse, 0),
	}

	srcs, err := s.Store.Sources(ctx).All(ctx)
	if err != nil {
		Error(w, http.StatusInternalServerError, "Error loading sources", s.Logger)
		return
	}

	sourceCh := make(chan sourceResponse, len(srcs))
	for _, src := range srcs {
		go func(src chronograf.Source) {
			src.Version = s.sourceVersion(ctx, &src)
			sourceCh <- newSourceResponse(ctx, src)
		}(src)
	}
	for i := 0; i < len(srcs); i++ {
		res.Sources = append(res.Sources, <-sourceCh)
	}

	encodeJSON(w, http.StatusOK, res, s.Logger)
}

// SourcesID retrieves a source from the store
func (s *Service) SourcesID(w http.ResponseWriter, r *http.Request) {
	id, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	ctx := r.Context()
	src, err := s.Store.Sources(ctx).Get(ctx, id)
	if err != nil {
		notFound(w, id, s.Logger)
		return
	}

	src.Version = s.sourceVersion(ctx, &src)

	res := newSourceResponse(ctx, src)
	encodeJSON(w, http.StatusOK, res, s.Logger)
}

// RemoveSource deletes the source from the store
func (s *Service) RemoveSource(w http.ResponseWriter, r *http.Request) {
	id, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	src := chronograf.Source{ID: id}
	ctx := r.Context()
	if err = s.Store.Sources(ctx).Delete(ctx, src); err != nil {
		if err == chronograf.ErrSourceNotFound {
			notFound(w, id, s.Logger)
		} else {
			unknownErrorWithMessage(w, err, s.Logger)
		}
		return
	}

	// Remove all the associated kapacitors for this source
	if err = s.removeSrcsKapa(ctx, id); err != nil {
		unknownErrorWithMessage(w, err, s.Logger)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// SourceHealth determines if the tsdb is running
func (s *Service) SourceHealth(w http.ResponseWriter, r *http.Request) {
	id, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	ctx := r.Context()
	src, err := s.Store.Sources(ctx).Get(ctx, id)
	if err != nil {
		notFound(w, id, s.Logger)
		return
	}

	cli := &influx.Client{
		Logger: s.Logger,
	}

	if err := cli.Connect(ctx, &src); err != nil {
		Error(w, http.StatusBadRequest, "Error contacting source", s.Logger)
		return
	}

	if err := cli.Ping(ctx); err != nil {
		Error(w, http.StatusBadRequest, "Error contacting source", s.Logger)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// removeSrcsKapa will remove all kapacitors and kapacitor rules from the stores.
// However, it will not remove the kapacitor tickscript from kapacitor itself.
func (s *Service) removeSrcsKapa(ctx context.Context, srcID int) error {
	kapas, err := s.Store.Servers(ctx).All(ctx)
	if err != nil {
		return err
	}

	// Filter the kapacitors to delete by matching the source id
	deleteKapa := []int{}
	for _, kapa := range kapas {
		if kapa.SrcID == srcID {
			deleteKapa = append(deleteKapa, kapa.ID)
		}
	}

	for _, kapaID := range deleteKapa {
		kapa := chronograf.Server{
			ID: kapaID,
		}
		s.Logger.Debug("Deleting kapacitor resource id ", kapa.ID)

		if err := s.Store.Servers(ctx).Delete(ctx, kapa); err != nil {
			return err
		}
	}

	return nil
}

// UpdateSource handles incremental updates of a data source
func (s *Service) UpdateSource(w http.ResponseWriter, r *http.Request) {
	id, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return
	}

	ctx := r.Context()
	src, err := s.Store.Sources(ctx).Get(ctx, id)
	if err != nil {
		notFound(w, id, s.Logger)
		return
	}

	var req chronograf.Source
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		invalidJSON(w, s.Logger)
		return
	}

	src.Default = req.Default
	src.InsecureSkipVerify = req.InsecureSkipVerify
	if req.Name != "" {
		src.Name = req.Name
	}
	if req.Password != "" {
		src.Password = req.Password
	}
	if req.Username != "" {
		src.Username = req.Username
	}
	if req.URL != "" {
		src.URL = req.URL
	}
	// If the supplied MetaURL is different from the
	// one supplied on the request, update the value
	if req.MetaURL != src.MetaURL {
		src.MetaURL = req.MetaURL
	}
	if req.Type != "" {
		src.Type = req.Type
	}
	if req.Telegraf != "" {
		src.Telegraf = req.Telegraf
	}
	src.DefaultRP = req.DefaultRP

	defaultOrg, err := s.Store.Organizations(ctx).DefaultOrganization(ctx)
	if err != nil {
		unknownErrorWithMessage(w, err, s.Logger)
		return
	}

	if err := ValidSourceRequest(&src, defaultOrg.ID); err != nil {
		invalidData(w, err, s.Logger)
		return
	}

	src.Version = s.sourceVersion(ctx, &src)

	dbType, err := s.tsdbType(ctx, &src)
	if err != nil {
		Error(w, http.StatusBadRequest, "Error contacting source", s.Logger)
		return
	}
	src.Type = dbType

	if req.ManagementToken != "" {
		src.ManagementToken = req.ManagementToken
	}
	if req.DatabaseToken != "" {
		src.DatabaseToken = req.DatabaseToken
	}
	if req.ClusterID != "" {
		src.ClusterID = req.ClusterID
	}
	if req.AccountID != "" {
		src.AccountID = req.AccountID
	}
	src.TagsCSVPath = req.TagsCSVPath

	if err := s.validateCredentials(ctx, &src); err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}

	// persist unless it is a dry-run
	if _, dryRun := r.URL.Query()["dryRun"]; !dryRun {
		if err := s.Store.Sources(ctx).Update(ctx, src); err != nil {
			msg := fmt.Sprintf("Error updating source ID %d", id)
			Error(w, http.StatusInternalServerError, msg, s.Logger)
			return
		}
	}
	encodeJSON(w, http.StatusOK, newSourceResponse(context.Background(), src), s.Logger)
}

// ValidSourceRequest checks if name, url, type, and role are valid
func ValidSourceRequest(s *chronograf.Source, defaultOrgID string) error {
	if s == nil {
		return fmt.Errorf("source must be non-nil")
	}
	// Name and URL areq required
	if s.URL == "" {
		return fmt.Errorf("url required")
	}
	// Validate Type
	if s.Type != "" {
		if s.Type != chronograf.InfluxDBv1 &&
			s.Type != chronograf.InfluxDBv1Enterprise &&
			s.Type != chronograf.InfluxDBv1Relay &&
			s.Type != chronograf.InfluxDBv2 &&
			s.Type != chronograf.InfluxDBv3Core &&
			s.Type != chronograf.InfluxDBv3Enterprise &&
			s.Type != chronograf.InfluxDBv3Clustered &&
			s.Type != chronograf.InfluxDBv3CloudDedicated {
			return fmt.Errorf("invalid source type %s", s.Type)
		}
	}

	if s.Organization == "" {
		s.Organization = defaultOrgID
	}

	url, err := url.ParseRequestURI(s.URL)
	if err != nil {
		return fmt.Errorf("invalid source URI: %v", err)
	}
	if len(url.Scheme) == 0 {
		return fmt.Errorf("invalid URL; no URL scheme defined")
	}

	if s.Type == chronograf.InfluxDBv3Core || s.Type == chronograf.InfluxDBv3Enterprise {
		if len(s.DatabaseToken) == 0 {
			return fmt.Errorf("database token required")
		}
	}

	if s.Type == chronograf.InfluxDBv3Clustered {
		if len(s.ManagementToken) == 0 {
			return fmt.Errorf("management token required")
		}
		if len(s.DatabaseToken) == 0 {
			return fmt.Errorf("database token required")
		}
		// TODO simon: make management token optional, similarly to Cloud Dedicated
	}

	if s.Type == chronograf.InfluxDBv3CloudDedicated {
		if len(s.ClusterID) == 0 {
			return fmt.Errorf("cluster ID required")
		}
		if _, err := uuid.Parse(s.ClusterID); err != nil {
			return fmt.Errorf("cluster ID is not a valid UUID")
		}
		if len(s.AccountID) == 0 {
			return fmt.Errorf("account ID required")
		}
		if _, err := uuid.Parse(s.AccountID); err != nil {
			return fmt.Errorf("account ID is not a valid UUID")
		}
		if len(s.ManagementToken) == 0 {
			return fmt.Errorf("management token required")
		}
		if len(s.DatabaseToken) == 0 {
			return fmt.Errorf("database token required")
		}
	}

	return nil
}

// NewSourceUser adds user to source
func (s *Service) NewSourceUser(w http.ResponseWriter, r *http.Request) {
	var req sourceUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		invalidJSON(w, s.Logger)
		return
	}

	if err := req.ValidCreate(); err != nil {
		invalidData(w, err, s.Logger)
		return
	}

	ctx := r.Context()
	srcID, ts, err := s.sourcesSeries(ctx, w, r)
	if err != nil {
		return
	}

	store := ts.Users(ctx)
	user := &chronograf.User{
		Name:        req.Username,
		Passwd:      req.Password,
		Permissions: req.Permissions,
		Roles:       req.Roles,
	}

	res, err := store.Add(ctx, user)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}

	su := newSourceUserResponse(srcID, res.Name).WithPermissions(res.Permissions)
	if _, hasRoles := s.hasRoles(ctx, ts); hasRoles {
		su.WithRoles(srcID, res.Roles)
	}
	location(w, su.Links.Self)
	encodeJSON(w, http.StatusCreated, su, s.Logger)
}

// SourceUsers retrieves all users from source.
func (s *Service) SourceUsers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	srcID, ts, err := s.sourcesSeries(ctx, w, r)
	if err != nil {
		return
	}

	store := ts.Users(ctx)
	users, err := store.All(ctx)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}

	_, hasRoles := s.hasRoles(ctx, ts)
	ur := make([]sourceUserResponse, len(users))
	for i, u := range users {
		usr := newSourceUserResponse(srcID, u.Name).WithPermissions(u.Permissions)
		if hasRoles {
			usr.WithRoles(srcID, u.Roles)
		}
		ur[i] = *usr
	}

	res := sourceUsersResponse{
		Users: ur,
	}

	encodeJSON(w, http.StatusOK, res, s.Logger)
}

// SourceUserID retrieves a user with ID from store.
// In InfluxDB, a User's Name is their UID, hence the semantic below.
func (s *Service) SourceUserID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	uid := httprouter.GetParamFromContext(ctx, "uid")

	srcID, ts, err := s.sourcesSeries(ctx, w, r)
	if err != nil {
		return
	}
	store := ts.Users(ctx)
	u, err := store.Get(ctx, chronograf.UserQuery{Name: &uid})
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}

	res := newSourceUserResponse(srcID, u.Name).WithPermissions(u.Permissions)
	if _, hasRoles := s.hasRoles(ctx, ts); hasRoles {
		res.WithRoles(srcID, u.Roles)
	}
	encodeJSON(w, http.StatusOK, res, s.Logger)
}

// RemoveSourceUser removes the user from the InfluxDB source
func (s *Service) RemoveSourceUser(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	uid := httprouter.GetParamFromContext(ctx, "uid")

	_, store, err := s.sourceUsersStore(ctx, w, r)
	if err != nil {
		return
	}

	if err := store.Delete(ctx, &chronograf.User{Name: uid}); err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// UpdateSourceUser changes the password or permissions of a source user
func (s *Service) UpdateSourceUser(w http.ResponseWriter, r *http.Request) {
	var req sourceUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		invalidJSON(w, s.Logger)
		return
	}
	if err := req.ValidUpdate(); err != nil {
		invalidData(w, err, s.Logger)
		return
	}

	ctx := r.Context()
	uid := httprouter.GetParamFromContext(ctx, "uid")
	srcID, ts, err := s.sourcesSeries(ctx, w, r)
	if err != nil {
		return
	}

	user := &chronograf.User{
		Name:        uid,
		Passwd:      req.Password,
		Permissions: req.Permissions,
		Roles:       req.Roles,
	}
	store := ts.Users(ctx)

	if err := store.Update(ctx, user); err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}

	u, err := store.Get(ctx, chronograf.UserQuery{Name: &uid})
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}

	res := newSourceUserResponse(srcID, u.Name).WithPermissions(u.Permissions)
	if _, hasRoles := s.hasRoles(ctx, ts); hasRoles {
		res.WithRoles(srcID, u.Roles)
	}
	location(w, res.Links.Self)
	encodeJSON(w, http.StatusOK, res, s.Logger)
}

func (s *Service) sourcesSeries(ctx context.Context, w http.ResponseWriter, r *http.Request) (int, chronograf.TimeSeries, error) {
	srcID, err := paramID("id", r)
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, err.Error(), s.Logger)
		return 0, nil, err
	}

	src, err := s.Store.Sources(ctx).Get(ctx, srcID)
	if err != nil {
		notFound(w, srcID, s.Logger)
		return 0, nil, err
	}

	ts, err := s.TimeSeries(src)
	if err != nil {
		msg := fmt.Sprintf("Unable to connect to source %d: %v", srcID, err)
		Error(w, http.StatusBadRequest, msg, s.Logger)
		return 0, nil, err
	}

	if err = ts.Connect(ctx, &src); err != nil {
		msg := fmt.Sprintf("Unable to connect to source %d: %v", srcID, err)
		Error(w, http.StatusBadRequest, msg, s.Logger)
		return 0, nil, err
	}
	return srcID, ts, nil
}

func (s *Service) sourceUsersStore(ctx context.Context, w http.ResponseWriter, r *http.Request) (int, chronograf.UsersStore, error) {
	srcID, ts, err := s.sourcesSeries(ctx, w, r)
	if err != nil {
		return 0, nil, err
	}

	store := ts.Users(ctx)
	return srcID, store, nil
}

// hasRoles checks if the influx source has roles or not
func (s *Service) hasRoles(ctx context.Context, ts chronograf.TimeSeries) (chronograf.RolesStore, bool) {
	store, err := ts.Roles(ctx)
	if err != nil {
		return nil, false
	}
	return store, true
}

type sourceUserRequest struct {
	Username    string                 `json:"name,omitempty"`        // Username for new account
	Password    string                 `json:"password,omitempty"`    // Password for new account
	Permissions chronograf.Permissions `json:"permissions,omitempty"` // Optional permissions
	Roles       []chronograf.Role      `json:"roles,omitempty"`       // Optional roles
}

func (r *sourceUserRequest) ValidCreate() error {
	if r.Username == "" {
		return fmt.Errorf("username required")
	}
	if r.Password == "" {
		return fmt.Errorf("password required")
	}
	return validPermissions(&r.Permissions)
}

type sourceUsersResponse struct {
	Users []sourceUserResponse `json:"users"`
}

func (r *sourceUserRequest) ValidUpdate() error {
	if r.Password == "" && r.Permissions == nil && r.Roles == nil {
		return fmt.Errorf("no fields to update")
	}
	return validPermissions(&r.Permissions)
}

type sourceUserResponse struct {
	Name           string                 // Username for new account
	Permissions    chronograf.Permissions // Account's permissions
	Roles          []sourceRoleResponse   // Roles if source uses them
	Links          selfLinks              // Links are URI locations related to user
	hasPermissions bool
	hasRoles       bool
}

func (u *sourceUserResponse) MarshalJSON() ([]byte, error) {
	res := map[string]interface{}{
		"name":  u.Name,
		"links": u.Links,
	}
	if u.hasRoles {
		res["roles"] = u.Roles
	}
	if u.hasPermissions {
		res["permissions"] = u.Permissions
	}
	return json.Marshal(res)
}

// newSourceUserResponse creates an HTTP JSON response for a user w/o roles
func newSourceUserResponse(srcID int, name string) *sourceUserResponse {
	self := newSelfLinks(srcID, "users", name)
	return &sourceUserResponse{
		Name:  name,
		Links: self,
	}
}

func (u *sourceUserResponse) WithPermissions(perms chronograf.Permissions) *sourceUserResponse {
	u.hasPermissions = true
	if perms == nil {
		perms = make(chronograf.Permissions, 0)
	}
	u.Permissions = perms
	return u
}

// WithRoles adds roles to the HTTP JSON response for a user
func (u *sourceUserResponse) WithRoles(srcID int, roles []chronograf.Role) *sourceUserResponse {
	u.hasRoles = true
	rr := make([]sourceRoleResponse, len(roles))
	for i, role := range roles {
		rr[i] = newSourceRoleResponse(srcID, &role)
	}
	u.Roles = rr
	return u
}

type selfLinks struct {
	Self string `json:"self"` // Self link mapping to this resource
}

func newSelfLinks(id int, parent, resource string) selfLinks {
	httpAPISrcs := "/chronograf/v1/sources"
	u := &url.URL{Path: resource}
	encodedResource := u.String()
	return selfLinks{
		Self: fmt.Sprintf("%s/%d/%s/%s", httpAPISrcs, id, parent, encodedResource),
	}
}

// NewSourceRole adds role to source
func (s *Service) NewSourceRole(w http.ResponseWriter, r *http.Request) {
	var req sourceRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		invalidJSON(w, s.Logger)
		return
	}

	if err := req.ValidCreate(); err != nil {
		invalidData(w, err, s.Logger)
		return
	}

	ctx := r.Context()
	srcID, ts, err := s.sourcesSeries(ctx, w, r)
	if err != nil {
		return
	}

	roles, ok := s.hasRoles(ctx, ts)
	if !ok {
		Error(w, http.StatusNotFound, fmt.Sprintf("Source %d does not have role capability", srcID), s.Logger)
		return
	}

	if _, err := roles.Get(ctx, req.Name); err == nil {
		Error(w, http.StatusBadRequest, fmt.Sprintf("Source %d already has role %s", srcID, req.Name), s.Logger)
		return
	}

	res, err := roles.Add(ctx, &req.Role)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}

	rr := newSourceRoleResponse(srcID, res)
	location(w, rr.Links.Self)
	encodeJSON(w, http.StatusCreated, rr, s.Logger)
}

// UpdateSourceRole changes the permissions or users of a role
func (s *Service) UpdateSourceRole(w http.ResponseWriter, r *http.Request) {
	var req sourceRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		invalidJSON(w, s.Logger)
		return
	}
	if err := req.ValidUpdate(); err != nil {
		invalidData(w, err, s.Logger)
		return
	}

	ctx := r.Context()
	srcID, ts, err := s.sourcesSeries(ctx, w, r)
	if err != nil {
		return
	}

	roles, ok := s.hasRoles(ctx, ts)
	if !ok {
		Error(w, http.StatusNotFound, fmt.Sprintf("Source %d does not have role capability", srcID), s.Logger)
		return
	}

	rid := httprouter.GetParamFromContext(ctx, "rid")
	req.Name = rid

	if err := roles.Update(ctx, &req.Role); err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}

	role, err := roles.Get(ctx, req.Name)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}
	rr := newSourceRoleResponse(srcID, role)
	location(w, rr.Links.Self)
	encodeJSON(w, http.StatusOK, rr, s.Logger)
}

// SourceRoleID retrieves a role with ID from store.
func (s *Service) SourceRoleID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	srcID, ts, err := s.sourcesSeries(ctx, w, r)
	if err != nil {
		return
	}

	roles, ok := s.hasRoles(ctx, ts)
	if !ok {
		Error(w, http.StatusNotFound, fmt.Sprintf("Source %d does not have role capability", srcID), s.Logger)
		return
	}

	rid := httprouter.GetParamFromContext(ctx, "rid")
	role, err := roles.Get(ctx, rid)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}
	rr := newSourceRoleResponse(srcID, role)
	encodeJSON(w, http.StatusOK, rr, s.Logger)
}

// SourceRoles retrieves all roles from the store
func (s *Service) SourceRoles(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	srcID, ts, err := s.sourcesSeries(ctx, w, r)
	if err != nil {
		return
	}

	store, ok := s.hasRoles(ctx, ts)
	if !ok {
		Error(w, http.StatusNotFound, fmt.Sprintf("Source %d does not have role capability", srcID), s.Logger)
		return
	}

	roles, err := store.All(ctx)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}

	rr := make([]sourceRoleResponse, len(roles))
	for i, role := range roles {
		rr[i] = newSourceRoleResponse(srcID, &role)
	}

	res := struct {
		Roles []sourceRoleResponse `json:"roles"`
	}{rr}
	encodeJSON(w, http.StatusOK, res, s.Logger)
}

// RemoveSourceRole removes role from data source.
func (s *Service) RemoveSourceRole(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	srcID, ts, err := s.sourcesSeries(ctx, w, r)
	if err != nil {
		return
	}

	roles, ok := s.hasRoles(ctx, ts)
	if !ok {
		Error(w, http.StatusNotFound, fmt.Sprintf("Source %d does not have role capability", srcID), s.Logger)
		return
	}

	rid := httprouter.GetParamFromContext(ctx, "rid")
	if err := roles.Delete(ctx, &chronograf.Role{Name: rid}); err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// sourceRoleRequest is the format used for both creating and updating roles
type sourceRoleRequest struct {
	chronograf.Role
}

func (r *sourceRoleRequest) ValidCreate() error {
	if r.Name == "" || len(r.Name) > 254 {
		return fmt.Errorf("Name is required for a role")
	}
	for _, user := range r.Users {
		if user.Name == "" {
			return fmt.Errorf("username required")
		}
	}
	return validPermissions(&r.Permissions)
}

func (r *sourceRoleRequest) ValidUpdate() error {
	if len(r.Name) > 254 {
		return fmt.Errorf("username too long; must be less than 254 characters")
	}
	for _, user := range r.Users {
		if user.Name == "" {
			return fmt.Errorf("username required")
		}
	}
	return validPermissions(&r.Permissions)
}

type sourceRoleResponse struct {
	Users       []*sourceUserResponse  `json:"users"`
	Name        string                 `json:"name"`
	Permissions chronograf.Permissions `json:"permissions"`
	Links       selfLinks              `json:"links"`
}

func newSourceRoleResponse(srcID int, res *chronograf.Role) sourceRoleResponse {
	su := make([]*sourceUserResponse, len(res.Users))
	for i := range res.Users {
		name := res.Users[i].Name
		su[i] = newSourceUserResponse(srcID, name)
	}

	if res.Permissions == nil {
		res.Permissions = make(chronograf.Permissions, 0)
	}
	return sourceRoleResponse{
		Name:        res.Name,
		Permissions: res.Permissions,
		Users:       su,
		Links:       newSelfLinks(srcID, "roles", res.Name),
	}
}

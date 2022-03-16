package roles

type contextKey string

// ContextKey is the key used to specify the
// role via context
const ContextKey = contextKey("role")

// Chronograf User Roles
const (
	MemberRoleName   = "member"
	ReaderRoleName   = "reader"
	ViewerRoleName   = "viewer"
	EditorRoleName   = "editor"
	AdminRoleName    = "admin"
	SuperAdminStatus = "superadmin"

	// Indicatior that the server should retrieve the default role for the organization.
	WildcardRoleName = "*"
)

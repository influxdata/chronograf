package cmd

import (
	"fmt"
	"html/template"
	"io"
	"log"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/Masterminds/semver"
	"github.com/pkg/errors"
	"github.com/spf13/cobra"
	git "gopkg.in/src-d/go-git.v4"
	"gopkg.in/src-d/go-git.v4/plumbing"
	"gopkg.in/src-d/go-git.v4/plumbing/object"
)

var generateCmd = &cobra.Command{
	Use:   "generate",
	Short: "Generate a changelog from commits for a specific tagged version.",
	Long: `Generate a changelog from commits for a specific tagged version.
The new release will version will be chosen based on the content of the commits between the current and previous release tags.
Commits must follow the conventional commit specification.

The generated changelog is written to standard out.
`,
	RunE: doGenerate,
}

var commitURL string
var versionStr string

func init() {
	rootCmd.AddCommand(generateCmd)

	generateCmd.PersistentFlags().StringVar(&commitURL, "commit-url", "", "URL for linking to specific commits. The commit SHA will be appended as the last path element of the URL.")
	generateCmd.PersistentFlags().StringVar(&versionStr, "version", "", "The version of the release, a change log is generated for all commits between this version and the next lowest version. If the version is empty a changelog is generated for HEAD.")
}

// doGenerate generates the changelog writing it to stdout.
func doGenerate(cmd *cobra.Command, args []string) error {
	r, err := git.PlainOpen(".")
	if err != nil {
		return err
	}

	release, err := createRelease(r, versionStr)
	if err != nil {
		return err
	}

	return writeChangelog(os.Stdout, release)
}

//  createRelease constructs the release object from the given git repo.
func createRelease(r *git.Repository, verTag string) (*Release, error) {
	currHash, err := findVersionHash(r, verTag)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to find git ref for %s", verTag)
	}
	var version *semver.Version
	if verTag != "" {
		version, err = semver.NewVersion(verTag)
		if err != nil {
			return nil, err
		}
	}
	prevVer, prevHash, err := findPreviousRelease(r, version)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to find previous git release tag for %v", verTag)
	}
	commits, err := findNewCommits(r, prevHash, currHash)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to find commits between %v and %v", prevHash, currHash)
	}

	breaking, features, fixes := organizeCommits(commits)

	ver := determineNextVersion(prevVer, len(breaking), len(features))

	return &Release{
		Version:         ver,
		PreviousVersion: prevVer,
		Date:            time.Now().Format("2006-01-02"),
		Breaking:        breaking,
		Features:        features,
		Fixes:           fixes,
		CommitURL:       commitURL,
	}, nil
}

// findVersionHash searches for a commit tagged with the version.
// If verTag is empty, HEAD is returned.
func findVersionHash(r *git.Repository, verTag string) (plumbing.Hash, error) {
	if verTag == "" {
		ref, err := r.Head()
		if err != nil {
			return plumbing.ZeroHash, err
		}
		return ref.Hash(), nil
	}
	ref, err := r.Tag(verTag)
	if err != nil {
		return plumbing.ZeroHash, err
	}
	tag, err := r.TagObject(ref.Hash())
	if err != nil {
		return plumbing.ZeroHash, err
	}
	return tag.Target, nil
}

// findPreviousRelease searches for the highest semantic version tag.
func findPreviousRelease(r *git.Repository, v *semver.Version) (*semver.Version, plumbing.Hash, error) {
	tags, err := r.Tags()
	if err != nil {
		return nil, plumbing.ZeroHash, err
	}
	defer tags.Close()
	var maxVersion *semver.Version
	var maxRef *plumbing.Reference
	for {
		tag, err := tags.Next()
		if err != nil {
			if err == io.EOF {
				break
			}
			return nil, plumbing.ZeroHash, err
		}
		ver, err := semver.NewVersion(tag.Name().Short())
		if err == nil &&
			(v == nil || ver.LessThan(v)) &&
			(maxVersion == nil || ver.GreaterThan(maxVersion)) {
			maxVersion = ver
			maxRef = tag
		}
	}
	tag, err := r.TagObject(maxRef.Hash())
	if err != nil {
		return nil, plumbing.ZeroHash, err
	}
	return maxVersion, tag.Target, nil
}

// findNewCommits queries the git repository for new commits since the last tagged release.
func findNewCommits(r *git.Repository, prevHash, currHash plumbing.Hash) ([]Commit, error) {
	logs, err := r.Log(&git.LogOptions{
		From: currHash,
	})
	if err != nil {
		return nil, errors.Wrapf(err, "failed to load logs from %v", currHash)
	}
	defer logs.Close()

	var commits []Commit
	for {
		commit, err := logs.Next()
		if err != nil {
			if err == io.EOF {
				break
			}
			return nil, err
		}
		if commit.Hash == prevHash {
			break
		}
		c, err := parseCommit(commit)
		if err == nil {
			commits = append(commits, c)
		} else {
			log.Printf("invalid commit message %v: %v", commit.Hash, err)
		}
	}
	return commits, nil
}

const (
	Feature = "feat"
	Fix     = "fix"
)

// organizeCommits filters commits into groups based on their type.
func organizeCommits(commits []Commit) (breaking, features, fixes []Commit) {
	breaking = make([]Commit, 0, len(commits))
	features = make([]Commit, 0, len(commits))
	fixes = make([]Commit, 0, len(commits))

	for _, c := range commits {
		if c.Breaking {
			breaking = append(breaking, c)
		}
		switch c.Type {
		case Feature:
			features = append(features, c)
		case Fix:
			fixes = append(fixes, c)
		default:
			//Ignore commit
		}
	}
	return
}

// ReleaseType corresponds the semantic version numbers.
type ReleaseType int

const (
	Major ReleaseType = iota
	Minor
	Patch
)

// determineNextVersion computes the next semantic version based on the types of commits in the release.
func determineNextVersion(prevVer *semver.Version, numBreaking, numFeatures int) *semver.Version {
	typ := Patch
	if numBreaking > 0 {
		typ = Major
		if prevVer.Major() == 0 {
			// Downgrade breaking change to minor release for pre 1.0.0 releases
			typ = Minor
		}
	} else if numFeatures > 0 {
		typ = Minor
	}
	v := incVersion(typ, *prevVer)
	return &v
}

// incVersion increments the semantic version according to the release type.
func incVersion(typ ReleaseType, v semver.Version) semver.Version {
	switch typ {
	case Major:
		return v.IncMajor()
	case Minor:
		return v.IncMinor()
	case Patch:
		return v.IncPatch()
	default:
		panic("unreachable")
	}
}

// Commit represents the conventional commit understanding of a git commit.
type Commit struct {
	Type          string
	Scope         string
	Description   string
	BodyAndFooter string
	Footer        string

	Breaking bool

	Hash       string
	ShortHash  string
	AuthorName string
}

// headerPattern matches the type, scope and description of a commit message header.
var headerPattern = regexp.MustCompile(`^(\w+)(\([\w/]+\))?:(.+)$`)

const breaking = "BREAKING CHANGE:"

func parseCommit(commit *object.Commit) (Commit, error) {
	var (
		header,
		bodyAndFooter string
	)
	lines := strings.Split(commit.Message, "\n\n")
	switch {
	case len(lines) >= 2:
		bodyAndFooter = strings.TrimSpace(strings.Join(lines[1:], "\n\n"))
		fallthrough
	case len(lines) == 1:
		header = strings.TrimSpace(lines[0])
	case len(lines) == 0:
		return Commit{}, errors.New("commit message is empty")
	}

	matches := headerPattern.FindStringSubmatch(header)
	if len(matches) != 4 {
		return Commit{}, fmt.Errorf("invalid header %q", header)
	}
	hashStr := commit.Hash.String()
	return Commit{
		Type:          matches[1],
		Scope:         matches[2],
		Description:   matches[3],
		BodyAndFooter: bodyAndFooter,
		// Technically this does not follow the SPEC that breaking changes must be noted in the body or footer.
		// The npm package to validate commit messages does not validate the body or footer,
		// as a result we cannot rely on commit messages having well formed bodies or footers.
		// We use a fuzzy approach here because a false negative is more expensive than a false positive.
		Breaking:   strings.Contains(bodyAndFooter, breaking),
		Hash:       hashStr,
		ShortHash:  hashStr[:7],
		AuthorName: commit.Author.Name,
	}, nil
}

// Release represents all the meta data about a release.
type Release struct {
	Version         *semver.Version
	PreviousVersion *semver.Version
	Date            string
	Breaking        []Commit
	Features        []Commit
	Fixes           []Commit

	CommitURL string
}

// changelogTmpl is a text/template for constructing a change log
// The template is evaluated against an instance of Release.
var changelogTmpl = template.Must(template.New("changelog").Parse(`{{ $commitURL := .CommitURL}}
## v{{.Version}} [{{.Date}}]
{{with .Breaking}}
### Breaking changes
{{range .}}
- [{{.ShortHash}}]({{$commitURL}}/{{.Hash}}){{.Description}}{{end}}{{end}}
{{with .Features}}
### Features
{{range .}}
- [{{.ShortHash}}]({{$commitURL}}/{{.Hash}}){{.Description}}{{end}}{{end}}
{{with .Fixes}}
### Bug fixes
{{range .}}
- [{{.ShortHash}}]({{$commitURL}}/{{.Hash}}){{.Description}}{{end}}{{end}}

`))

func writeChangelog(w io.Writer, release *Release) error {
	return changelogTmpl.Execute(w, release)
}

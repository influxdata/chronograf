package influx

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/influxdata/chronograf/log"
)

func TestCSVTagsStore_GetMeasurementsMap(t *testing.T) {
	tests := []struct {
		name     string
		content  string
		expected MeasurementsMap
		wantErr  bool
	}{
		{
			name: "simple valid input",
			content: `
meas1;tag1;val1
meas1;tag1;val2
meas1;tag2;val3
`,
			expected: MeasurementsMap{
				"meas1": {
					"tag1": {"val1", "val2"},
					"tag2": {"val3"},
				},
			},
			wantErr: false,
		},
		{
			name:     "empty input",
			content:  ``,
			expected: MeasurementsMap{},
			wantErr:  false,
		},
		{
			name: "incomplete lines are skipped",
			content: `
meas1;tag1;val1
meas1
meas1;tag2;val2
`,
			expected: MeasurementsMap{
				"meas1": {
					"tag1": {"val1"},
					"tag2": {"val2"},
				},
			},
			wantErr: false,
		},
		{
			name: "header line is skipped",
			content: `measurement;tag-key;tag-value
meas1;tag1;val1
meas1;tag2;val2
`,
			expected: MeasurementsMap{
				"meas1": {
					"tag1": {"val1"},
					"tag2": {"val2"},
				},
			},
			wantErr: false,
		},
		{
			name: "header with extra spaces is skipped",
			content: ` measurement ; tag-key ; tag-value 
meas1;tag1;val1
meas1;tag2;val2
`,
			expected: MeasurementsMap{
				"meas1": {
					"tag1": {"val1"},
					"tag2": {"val2"},
				},
			},
			wantErr: false,
		},
		{
			name: "non-header first line is not skipped",
			content: `measurement;tag-key;different-value
meas1;tag1;val1
`,
			expected: MeasurementsMap{
				"measurement": {
					"tag-key": {"different-value"},
				},
				"meas1": {
					"tag1": {"val1"},
				},
			},
			wantErr: false,
		},
	}

	const testDB = "testdb"

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tmpDir, err := setupCSVTestDirWithContent(testDB, tt.content)
			if err != nil {
				t.Fatalf("could not setup CSV test dir: %v", err)
			}
			defer os.RemoveAll(tmpDir)

			store, err := NewCSVTagsStore(tmpDir, log.New(log.DebugLevel))
			if err != nil {
				t.Fatalf("could not create CSV tags store: %v", err)
			}

			// Test the directory-based approach using GetMeasurementsMap
			if tt.content != "" {
				// Test that we can load the measurements for testDB
				measurements := store.GetMeasurementsMap(testDB)
				if measurements == nil {
					t.Errorf("expected measurements for %s, got nil", testDB)
					return
				}

				// Compare with expected measurements
				if !equalMeasurementsMap(measurements, tt.expected) {
					t.Errorf("unexpected measurements:\nGot: %#v\nWant: %#v", measurements, tt.expected)
				}
			} else {
				// For empty content, test that GetMeasurementsMap returns nil for testDB
				measurements := store.GetMeasurementsMap(testDB)
				if measurements != nil {
					t.Errorf("expected nil measurements for empty content, got: %#v", measurements)
				}
			}
		})
	}
}

// equalMeasurementsMap compares two MeasurementsMap values deeply
func equalMeasurementsMap(a, b MeasurementsMap) bool {
	if len(a) != len(b) {
		return false
	}
	for meas, tags := range a {
		bTags, ok := b[meas]
		if !ok || len(tags) != len(bTags) {
			return false
		}
		for tag, values := range tags {
			bValues, ok := bTags[tag]
			if !ok || len(values) != len(bValues) {
				return false
			}
			for i := range values {
				if values[i] != bValues[i] {
					return false
				}
			}
		}
	}
	return true
}

// setupCSVTestDirWithContent creates a temporary directory with a CSV file containing raw content
func setupCSVTestDirWithContent(dbName string, csvContent string) (string, error) {
	tmpDir, err := os.MkdirTemp("", "csv-test-")
	if err != nil {
		return "", err
	}

	if csvContent != "" {
		csvFile := filepath.Join(tmpDir, dbName+".csv")
		if err := os.WriteFile(csvFile, []byte(csvContent), 0644); err != nil {
			os.RemoveAll(tmpDir)
			return "", err
		}
	}

	return tmpDir, nil
}

func TestCSVTagsStore_HasDatabase(t *testing.T) {
	const testDB = "testdb"

	tests := []struct {
		name          string
		csvContent    string
		queryDatabase string
		expected      bool
	}{
		{
			name:          "existing database",
			csvContent:    "meas1;tag1;val1\n",
			queryDatabase: testDB,
			expected:      true,
		},
		{
			name:          "non-existing database",
			csvContent:    "meas1;tag1;val1\n",
			queryDatabase: "nonexistent",
			expected:      false,
		},
		{
			name:          "empty csv directory",
			csvContent:    "",
			queryDatabase: testDB,
			expected:      false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tmpDir, err := setupCSVTestDirWithContent(testDB, tt.csvContent)
			if err != nil {
				t.Fatalf("could not setup CSV test dir: %v", err)
			}
			defer os.RemoveAll(tmpDir)

			store, err := NewCSVTagsStore(tmpDir, log.New(log.DebugLevel))
			if err != nil {
				t.Fatalf("could not create CSV tags store: %v", err)
			}
			result := store.HasDatabase(tt.queryDatabase)

			if result != tt.expected {
				t.Errorf("HasDatabase(%q) = %v, want %v", tt.queryDatabase, result, tt.expected)
			}
		})
	}
}

func TestCSVTagsStore_NewCSVTagsStore_InvalidDirectory(t *testing.T) {
	t.Run("non-existent directory", func(t *testing.T) {
		_, err := NewCSVTagsStore("/path/that/does/not/exist", log.New(log.DebugLevel))
		if err == nil {
			t.Error("Expected error for non-existent directory, got nil")
		}
		if !strings.Contains(err.Error(), "does not exist") {
			t.Errorf("Expected error message to contain 'does not exist', got: %v", err)
		}
	})

	t.Run("path is a file not a directory", func(t *testing.T) {
		// Create a temporary file
		tmpFile, err := os.CreateTemp("", "test-file-*.txt")
		if err != nil {
			t.Fatalf("could not create temp file: %v", err)
		}
		tmpFilePath := tmpFile.Name()
		tmpFile.Close()
		defer os.Remove(tmpFilePath)

		// Try to create CSVTagsStore with a file path instead of directory
		_, err = NewCSVTagsStore(tmpFilePath, log.New(log.DebugLevel))
		if err == nil {
			t.Error("Expected error for file path instead of directory, got nil")
		}
		if !strings.Contains(err.Error(), "not a directory") {
			t.Errorf("Expected error message to contain 'not a directory', got: %v", err)
		}
	})

	t.Run("empty path is rejected", func(t *testing.T) {
		_, err := NewCSVTagsStore("", log.New(log.DebugLevel))
		if err == nil {
			t.Error("Expected error for empty path, got nil")
		}
		if !strings.Contains(err.Error(), "cannot be empty") {
			t.Errorf("Expected error message to contain 'cannot be empty', got: %v", err)
		}
	})
}

func TestCSVTagsStore_ErrorHandling(t *testing.T) {
	const testDB = "testdb"

	t.Run("invalid CSV content", func(t *testing.T) {
		// Create a directory but no CSV file
		tmpDir, err := os.MkdirTemp("", "csv-test-")
		if err != nil {
			t.Fatalf("could not create temp dir: %v", err)
		}
		defer os.RemoveAll(tmpDir)

		store, err := NewCSVTagsStore(tmpDir, log.New(log.DebugLevel))
		if err != nil {
			t.Fatalf("could not create CSV tags store: %v", err)
		}
		measurements := store.GetMeasurementsMap(testDB)

		// Should return nil when CSV file doesn't exist
		if measurements != nil {
			t.Errorf("Expected nil measurements for non-existent CSV, got: %#v", measurements)
		}
	})
}

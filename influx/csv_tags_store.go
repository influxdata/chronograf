package influx

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/influxdata/chronograf"
)

const csvFileExtension = ".csv"

// TagValues represents a set of tag values for a specific tag key
type TagValues []string

// TagKeysMap represents a map of tag keys to their possible values
type TagKeysMap map[string]TagValues

// MeasurementsMap represents a map of measurement names to their tag structure
type MeasurementsMap map[string]TagKeysMap

// CSVTagsStore manages tags loaded from CSV files for InfluxDB Cloud Dedicated.
// It uses a directory containing per-database CSV files named `<database>.csv`
// and caches tags for the last accessed database.
type CSVTagsStore struct {
	csvDirPath string
	logs       chronograf.Logger

	cachedDatabase string          // Currently cached database name
	cachedTags     MeasurementsMap // Tags for the currently cached database

	lock sync.Mutex
}

// NewCSVTagsStore creates a new CSVTagsStore instance with the given CSV directory path.
// Returns an error if csvDirPath is empty, doesn't exist, or is not a directory.
func NewCSVTagsStore(csvDirPath string, logger chronograf.Logger) (*CSVTagsStore, error) {
	if csvDirPath == "" {
		return nil, fmt.Errorf("CSV directory path cannot be empty")
	}

	fileInfo, err := os.Stat(csvDirPath)
	if os.IsNotExist(err) {
		return nil, fmt.Errorf("CSV directory path does not exist: %s", csvDirPath)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to stat CSV directory path: %w", err)
	}
	if !fileInfo.IsDir() {
		return nil, fmt.Errorf("CSV path is not a directory: %s", csvDirPath)
	}

	return &CSVTagsStore{
		csvDirPath:     csvDirPath,
		logs:           logger.WithField("component", "csv-tags-store").WithField("dir", csvDirPath),
		cachedDatabase: "",
		cachedTags:     make(MeasurementsMap),
	}, nil
}

// ensureDatabaseLoaded ensures the specified database is loaded in cache.
// If a different database is already cached, it drops the old cache and loads the new one.
func (c *CSVTagsStore) ensureDatabaseLoaded(database string) error {
	// If this database is already cached, nothing to do
	if c.cachedDatabase == database {
		return nil
	}

	// Load the new database
	measurements, err := c.readDatabaseCSV(database)
	if err != nil {
		if c.logs != nil {
			c.logs.WithField("database", database).Error("Could not read database CSV: ", err)
		}
		return err
	}

	// Replace the cache
	c.cachedDatabase = database
	c.cachedTags = measurements

	if c.logs != nil {
		c.logs.WithField("database", database).Info("Loaded database tags from CSV")
	}

	return nil
}

// readDatabaseCSV reads tags for a specific database from its CSV file
func (c *CSVTagsStore) readDatabaseCSV(database string) (MeasurementsMap, error) {
	csvFileName := database + csvFileExtension
	csvFilePath := filepath.Join(c.csvDirPath, csvFileName)

	startTime := time.Now()
	recordCount := 0

	// Check if the file exists
	if _, err := os.Stat(csvFilePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("CSV file for database %s does not exist: %s", database, csvFilePath)
	}

	// Open the CSV file
	file, err := os.Open(csvFilePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open CSV file %s: %w", csvFilePath, err)
	}
	defer func() { _ = file.Close() }()

	// Create a CSV reader
	reader := csv.NewReader(file)
	reader.Comma = ';'
	reader.FieldsPerRecord = -1

	measurements := make(MeasurementsMap)
	isFirstLine := true
	for {
		record, err := reader.Read()
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return nil, fmt.Errorf("failed to read CSV record from %s: %w", csvFileName, err)
		}

		// Skip the header line if it matches the expected format (`measurement;tag-key;tag-value`)
		if isFirstLine {
			isFirstLine = false
			if len(record) == 3 &&
				strings.TrimSpace(record[0]) == "measurement" &&
				strings.TrimSpace(record[1]) == "tag-key" &&
				strings.TrimSpace(record[2]) == "tag-value" {
				continue
			}
		}

		recordCount++

		if len(record) < 3 {
			continue // Skip incomplete records - we expect: measurement, tag, value
		}

		meas, tag, val := strings.TrimSpace(record[0]), strings.TrimSpace(record[1]), strings.TrimSpace(record[2])
		if _, ok := measurements[meas]; !ok {
			measurements[meas] = make(TagKeysMap)
		}
		measurements[meas][tag] = append(measurements[meas][tag], val)
	}

	// Log performance metrics
	if c.logs != nil {
		c.logs.WithField("database", database).
			WithField("records", recordCount).
			WithField("duration", time.Since(startTime)).
			Debug("CSV file loaded successfully")
	}

	return measurements, nil
}

// GetMeasurementsMap returns the measurements map for a given database.
// IMPORTANT: The returned map is read-only and must not be modified by the caller!
// Modifying the returned map or its nested structures may cause data corruption
// and race conditions!
func (c *CSVTagsStore) GetMeasurementsMap(database string) MeasurementsMap {
	c.lock.Lock()
	defer c.lock.Unlock()

	if err := c.ensureDatabaseLoaded(database); err != nil {
		return nil
	}

	return c.cachedTags
}

// HasDatabase checks if a database exists by checking the existence of the csv file
func (c *CSVTagsStore) HasDatabase(database string) bool {
	c.lock.Lock()
	defer c.lock.Unlock()

	csvFilePath := filepath.Join(c.csvDirPath, database+csvFileExtension)
	_, err := os.Stat(csvFilePath)
	return err == nil
}

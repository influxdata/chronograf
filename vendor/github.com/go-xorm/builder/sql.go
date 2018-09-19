// Copyright 2018 The Xorm Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package builder

import (
	"fmt"
	"reflect"
	"time"
)

func condToSQL(cond Cond) (string, []interface{}, error) {
	if cond == nil || !cond.IsValid() {
		return "", nil, nil
	}

	w := NewWriter()
	if err := cond.WriteTo(w); err != nil {
		return "", nil, err
	}
	return w.writer.String(), w.args, nil
}

func condToBoundSQL(cond Cond) (string, error) {
	if cond == nil || !cond.IsValid() {
		return "", nil
	}

	w := NewWriter()
	if err := cond.WriteTo(w); err != nil {
		return "", err
	}
	return ConvertToBoundSQL(w.writer.String(), w.args)
}

// ToSQL convert a builder or conditions to SQL and args
func ToSQL(cond interface{}) (string, []interface{}, error) {
	switch cond.(type) {
	case Cond:
		return condToSQL(cond.(Cond))
	case *Builder:
		return cond.(*Builder).ToSQL()
	}
	return "", nil, ErrNotSupportType
}

// ToBoundSQL convert a builder or conditions to parameters bound SQL
func ToBoundSQL(cond interface{}) (string, error) {
	switch cond.(type) {
	case Cond:
		return condToBoundSQL(cond.(Cond))
	case *Builder:
		return cond.(*Builder).ToBoundSQL()
	}
	return "", ErrNotSupportType
}

func noSQLQuoteNeeded(a interface{}) bool {
	switch a.(type) {
	case int, int8, int16, int32, int64:
		return true
	case uint, uint8, uint16, uint32, uint64:
		return true
	case float32, float64:
		return true
	case bool:
		return true
	case string:
		return false
	case time.Time, *time.Time:
		return false
	}

	t := reflect.TypeOf(a)
	switch t.Kind() {
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return true
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return true
	case reflect.Float32, reflect.Float64:
		return true
	case reflect.Bool:
		return true
	case reflect.String:
		return false
	}

	return false
}

// ConvertToBoundSQL will convert SQL and args to a bound SQL
func ConvertToBoundSQL(sql string, args []interface{}) (string, error) {
	buf := StringBuilder{}
	var i, j, start int
	for ; i < len(sql); i++ {
		if sql[i] == '?' {
			_, err := buf.WriteString(sql[start:i])
			if err != nil {
				return "", err
			}
			start = i + 1

			if len(args) == j {
				return "", ErrNeedMoreArguments
			}

			if noSQLQuoteNeeded(args[j]) {
				_, err = fmt.Fprint(&buf, args[j])
			} else {
				_, err = fmt.Fprintf(&buf, "'%v'", args[j])
			}
			if err != nil {
				return "", err
			}
			j = j + 1
		}
	}
	_, err := buf.WriteString(sql[start:])
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

// ConvertPlaceholder replaces ? to $1, $2 ... or :1, :2 ... according prefix
func ConvertPlaceholder(sql, prefix string) (string, error) {
	buf := StringBuilder{}
	var i, j, start int
	for ; i < len(sql); i++ {
		if sql[i] == '?' {
			_, err := buf.WriteString(sql[start:i])
			if err != nil {
				return "", err
			}
			start = i + 1

			_, err = buf.WriteString(prefix)
			if err != nil {
				return "", err
			}

			j = j + 1
			_, err = buf.WriteString(fmt.Sprintf("%d", j))
			if err != nil {
				return "", err
			}
		}
	}
	_, err := buf.WriteString(sql[start:])
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

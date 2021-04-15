package kapacitor

import (
	"testing"

	"github.com/influxdata/chronograf"
)

func TestValidateAlert(t *testing.T) {
	tests := []struct {
		name    string
		service string
		wantErr bool
	}{
		{
			name:    "Test valid template alert",
			service: ".slack()",
			wantErr: false,
		},
		{
			name:    "Test invalid template alert",
			service: ".invalid()",
			wantErr: true,
		},
	}
	for _, tt := range tests {
		if err := ValidateAlert(tt.service); (err != nil) != tt.wantErr {
			t.Errorf("%q. ValidateAlert() error = %v, wantErr %v", tt.name, err, tt.wantErr)
		}
	}
}

func Test_validateTick(t *testing.T) {
	tests := []struct {
		name    string
		script  chronograf.TICKScript
		wantErr bool
	}{
		{
			name:    "Valid Script",
			script:  "stream|from()",
			wantErr: false,
		},
		{
			name:    "Valid stream Script with batch string",
			script:  "stream|from().database('batch')",
			wantErr: false,
		},
		{
			name:    "Valid batch Script",
			script:  "batch|query('select * from bar')",
			wantErr: false,
		},
		{
			name:    "Invalid Script",
			script:  "stream|nothing",
			wantErr: true,
		},
	}
	for _, tt := range tests {
		if err := validateTick(tt.script); (err != nil) != tt.wantErr {
			t.Errorf("%q. validateTick() error = %v, wantErr %v", tt.name, err, tt.wantErr)
		}
	}
}

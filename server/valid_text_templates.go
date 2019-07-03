package server

import (
	"encoding/json"
	"net/http"
	"text/template"
)

// ValidTextTemplateRequest is the request json for validation
type ValidTextTemplateRequest struct {
	Template string `json:"template"`
}

// ValidTextTemplateResponse is the response for template validation
type ValidTextTemplateResponse struct {
	Valid string `json:"valid"`
}

// ValidateTextTemplate will validate the template string
func (s *Service) ValidateTextTemplate(w http.ResponseWriter, r *http.Request) {
	var req ValidTextTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		invalidJSON(w, s.Logger)
		return
	}

	_, err := template.New("test_template").Parse(req.Template)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error(), s.Logger)
		return
	}

	res := ValidTextTemplateResponse{
		Valid: "nice template",
	}

	encodeJSON(w, http.StatusOK, res, s.Logger)
}

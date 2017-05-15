package kapacitor

import (
	"fmt"
	"strings"

	"github.com/influxdata/chronograf"
)

func kapaHandler(handler string) (string, error) {
	switch handler {
	case "hipchat":
		return "hipChat", nil
	case "opsgenie":
		return "opsGenie", nil
	case "pagerduty":
		return "pagerDuty", nil
	case "victorops":
		return "victorOps", nil
	case "smtp":
		return "email", nil
	case "http":
		return "post", nil
	case "alerta", "sensu", "slack", "email", "talk", "telegram", "post", "tcp", "exec", "log":
		return handler, nil
	default:
		return "", fmt.Errorf("Unsupported alert handler %s", handler)
	}
}

func toKapaFunc(method string, args []string) (string, error) {
	if len(args) == 0 {
		return fmt.Sprintf(".%s()", method), nil
	}
	params := make([]string, len(args))
	copy(params, args)
	// Kapacitor strings are quoted
	for i, p := range params {
		params[i] = fmt.Sprintf("'%s'", p)
	}
	return fmt.Sprintf(".%s(%s)", method, strings.Join(params, ",")), nil
}

func addAlertNodes(rule chronograf.AlertRule) (string, error) {
	alert := ""
	// Using a map to try to combine older API in .Alerts with .AlertNodes
	nodes := map[string]chronograf.KapacitorNode{}
	for _, node := range rule.AlertNodes {
		handler, err := kapaHandler(node.Name)
		if err != nil {
			return "", err
		}
		nodes[handler] = node
	}

	for _, a := range rule.Alerts {
		handler, err := kapaHandler(a)
		if err != nil {
			return "", err
		}
		// If the this handler is not in nodes, then there are
		// there are no arguments or properties
		if _, ok := nodes[handler]; !ok {
			alert = alert + fmt.Sprintf(".%s()", handler)
		}
	}

	for handler, node := range nodes {
		service, err := toKapaFunc(handler, node.Args)
		if err != nil {
			return "", nil
		}
		alert = alert + service
		for _, prop := range node.Properties {
			alertProperty, err := toKapaFunc(prop.Name, prop.Args)
			if err != nil {
				return "", nil
			}
			alert = alert + alertProperty
		}
	}
	return alert, nil
}

// AlertServices generates alert chaining methods to be attached to an alert from all rule Services
func AlertServices(rule chronograf.AlertRule) (string, error) {
	node, err := addAlertNodes(rule)
	if err != nil {
		return "", err
	}

	if err := ValidateAlert(node); err != nil {
		return "", err
	}
	return node, nil
}

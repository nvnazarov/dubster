package retry

import (
	"errors"
	"strconv"
	"strings"
	"time"
)

var ErrFormat = errors.New("bad format")

// Parse parses [Policy] from its string representation.
//
// Format:
//
//	"exp(start:1s cap:3s timeout:3s retry:3 power:2)"
func Parse(s string) (Policy, error) {
	if strings.HasPrefix(s, "exp(") && strings.HasSuffix(s, ")") {
		params := strings.Split(s[4:len(s)-1], " ")
		policy := Exponent()
		for _, p := range params {
			name, value, ok := strings.Cut(p, ":")
			if !ok {
				return nil, ErrFormat
			}
			switch name {
			case "start":
				d, err := time.ParseDuration(value)
				if err != nil {
					return nil, ErrFormat
				}
				policy = policy.Start(d)
			case "cap":
				d, err := time.ParseDuration(value)
				if err != nil {
					return nil, ErrFormat
				}
				policy = policy.Cap(d)
			case "timeout":
				d, err := time.ParseDuration(value)
				if err != nil {
					return nil, ErrFormat
				}
				policy = policy.Timeout(d)
			case "retry":
				n, err := strconv.Atoi(value)
				if err != nil {
					return nil, ErrFormat
				}
				policy = policy.Retry(n)
			case "power":
				f, err := strconv.ParseFloat(value, 64)
				if err != nil {
					return nil, ErrFormat
				}
				policy = policy.Power(f)
			default:
				return nil, ErrFormat
			}
		}
		return policy.Build(), nil
	}
	return nil, ErrFormat
}

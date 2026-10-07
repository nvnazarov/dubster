package size

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

type Size int

const (
	B Size = 1 << (10 * iota)
	KB
	MB
	GB
	TB
)

var ErrFormat = errors.New("invalid format")

func (s Size) B() int {
	return int(s)
}

func (s Size) String() string {
	switch {
	case s >= TB:
		f := float64(s) / float64(TB)
		return fmt.Sprintf("%.2fTB", f)
	case s >= GB:
		f := float64(s) / float64(GB)
		return fmt.Sprintf("%.2fGB", f)
	case s >= MB:
		f := float64(s) / float64(MB)
		return fmt.Sprintf("%.2fMB", f)
	case s >= KB:
		f := float64(s) / float64(KB)
		return fmt.Sprintf("%.2fKB", f)
	default:
		return strconv.Itoa(int(s)) + "B"
	}
}

func Parse(s string) (Size, error) {
	s = strings.ToUpper(s)
	switch {
	case strings.HasSuffix(s, "TB"):
		if f, err := strconv.ParseFloat(s[:len(s)-2], 64); err != nil {
			return 0, err
		} else {
			return Size(int(f * float64(TB))), nil
		}
	case strings.HasSuffix(s, "GB"):
		if f, err := strconv.ParseFloat(s[:len(s)-2], 64); err != nil {
			return 0, err
		} else {
			return Size(int(f * float64(GB))), nil
		}
	case strings.HasSuffix(s, "MB"):
		if f, err := strconv.ParseFloat(s[:len(s)-2], 64); err != nil {
			return 0, err
		} else {
			return Size(int(f * float64(MB))), nil
		}
	case strings.HasSuffix(s, "KB"):
		if f, err := strconv.ParseFloat(s[:len(s)-2], 64); err != nil {
			return 0, err
		} else {
			return Size(int(f * float64(KB))), nil
		}
	case strings.HasSuffix(s, "B"):
		if f, err := strconv.ParseFloat(s[:len(s)-2], 64); err != nil {
			return 0, err
		} else {
			return Size(int(f * float64(B))), nil
		}
	default:
		return 0, ErrFormat
	}
}

func MustParse(s string) Size {
	size, err := Parse(s)
	if err != nil {
		panic(err)
	}
	return size
}

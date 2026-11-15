package verification

type Status int

const (
	StatusNone Status = iota
	StatusOk
	StatusVideoTooLong
	StatusVideoTooShort
	StatusVideoTooBig
	StatusVideoBadFormat
	StatusBad // Generic status for all other verification errors.
)

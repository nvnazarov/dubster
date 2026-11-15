package clip

import (
	"time"

	"github.com/nvnazarov/dubster/server/internal/domain/model/verification"
)

type Sex string

const (
	None   Sex = ""
	Male   Sex = "male"
	Female Sex = "female"
)

type Role struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Sex  Sex    `json:"sex,omitempty"`
}

type Segment struct {
	ID     string        `json:"id"`
	Begin  time.Duration `json:"begin"`
	End    time.Duration `json:"end"`
	Line   string        `json:"line"`
	RoleID string        `json:"roleID"`
}

type Clip struct {
	ID                 string              `json:"id"`
	AuthorID           string              `json:"authorID"`
	Title              string              `json:"title"`
	Description        string              `json:"description,omitempty"`
	Segments           map[string]Segment  `json:"segments"`
	Roles              map[string]Role     `json:"roles"`
	Rating             float64             `json:"rating"`
	VerificationStatus verification.Status `json:"verificationStatus"`
	DateCreated        time.Time           `json:"dateCreated"`
	DateVerified       time.Time           `json:"dateVerified"`
}

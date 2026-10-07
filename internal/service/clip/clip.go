package clip

import "time"

type Role struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Sex  string `json:"sex"`
}

type Segment struct {
	ID     string        `json:"id"`
	Begin  time.Duration `json:"begin"`
	End    time.Duration `json:"end"`
	Line   string        `json:"line"`
	RoleID string        `json:"roleID"`
}

type Clip struct {
	ID           string             `json:"id"`
	AuthorID     string             `json:"authorID"`
	Title        string             `json:"title"`
	Description  string             `json:"description"`
	Segments     map[string]Segment `json:"segments"`
	Roles        map[string]Role    `json:"roles"`
	Verified     bool               `json:"verified"`
	DateCreated  time.Time          `json:"dateCreated"`
	DateVerified time.Time          `json:"dateVerified"`
}

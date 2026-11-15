package verification

import (
	"time"

	"github.com/nvnazarov/dubster/server/internal/misc/size"
)

const (
	MaxVideoSize         size.Size     = 200 * size.MB
	MinVideoDuration     time.Duration = 5 * time.Second
	MaxVideoDuration     time.Duration = 10 * time.Minute
	MinRoles             int           = 1
	MaxRoles             int           = 10
	MinSegments          int           = 1
	MaxSegments          int           = 100
	MinSegmentDuration   time.Duration = 1 * time.Second
	MaxSegmentDuration   time.Duration = 20 * time.Second
	MinTitleLength       int           = 1
	MaxTitleLength       int           = 64
	MinDescriptionLength int           = 0
	MaxDescriptionLength int           = 2048
	MinLineLength        int           = 0
	MaxLineLength        int           = 256
	MinRoleNameLength    int           = 1
	MaxRoleNameLength    int           = 32
)

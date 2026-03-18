package notification

import (
	"crypto/rand"
	"encoding/hex"
	"strings"
)

func randomHex(bytesLen int) string {
	if bytesLen <= 0 {
		bytesLen = 8
	}

	buffer := make([]byte, bytesLen)
	if _, err := rand.Read(buffer); err != nil {
		return "0000000000000000"
	}

	return hex.EncodeToString(buffer)
}

func normalizeSessionID(value string) string {
	return strings.TrimSpace(value)
}

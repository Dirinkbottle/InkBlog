package notification

import (
	"sort"
	"sync"
	"time"
)

type StreamEvent struct {
	Event string
	Data  interface{}
}

type StreamConnection struct {
	SessionID   string
	UserID      *uint
	ConnectedAt time.Time
	Events      chan StreamEvent
	Replaced    chan struct{}
}

type ConnectionRegistry struct {
	mu           sync.RWMutex
	sessions     map[string]*StreamConnection
	userSessions map[uint]map[string]struct{}
}

func NewConnectionRegistry() *ConnectionRegistry {
	return &ConnectionRegistry{
		sessions:     make(map[string]*StreamConnection),
		userSessions: make(map[uint]map[string]struct{}),
	}
}

func (r *ConnectionRegistry) Register(conn *StreamConnection) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if conn.ConnectedAt.IsZero() {
		conn.ConnectedAt = time.Now()
	}

	if existing, ok := r.sessions[conn.SessionID]; ok {
		select {
		case <-existing.Replaced:
		default:
			close(existing.Replaced)
		}
		if existing.UserID != nil {
			r.removeUserSessionLocked(*existing.UserID, existing.SessionID)
		}
	}

	r.sessions[conn.SessionID] = conn
	if conn.UserID != nil {
		if _, ok := r.userSessions[*conn.UserID]; !ok {
			r.userSessions[*conn.UserID] = make(map[string]struct{})
		}
		r.userSessions[*conn.UserID][conn.SessionID] = struct{}{}
	}
}

func (r *ConnectionRegistry) Unregister(sessionID string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	conn, ok := r.sessions[sessionID]
	if !ok {
		return
	}

	delete(r.sessions, sessionID)
	if conn.UserID != nil {
		r.removeUserSessionLocked(*conn.UserID, sessionID)
	}
}

func (r *ConnectionRegistry) HasSession(sessionID string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	_, ok := r.sessions[sessionID]
	return ok
}

func (r *ConnectionRegistry) UserSessions(userID uint) []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	sessions := r.userSessions[userID]
	if len(sessions) == 0 {
		return nil
	}

	result := make([]string, 0, len(sessions))
	for sessionID := range sessions {
		result = append(result, sessionID)
	}
	return result
}

func (r *ConnectionRegistry) AllSessions() []StreamIdentity {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]StreamIdentity, 0, len(r.sessions))
	for sessionID, conn := range r.sessions {
		result = append(result, StreamIdentity{
			SessionID: sessionID,
			UserID:    conn.UserID,
		})
	}
	return result
}

func (r *ConnectionRegistry) Connections() []OnlineSession {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]OnlineSession, 0, len(r.sessions))
	for sessionID, conn := range r.sessions {
		session := OnlineSession{
			SessionID: sessionID,
			UserID:    conn.UserID,
		}
		if !conn.ConnectedAt.IsZero() {
			connectedAt := conn.ConnectedAt
			session.ConnectedAt = &connectedAt
		}
		result = append(result, session)
	}

	sort.Slice(result, func(i, j int) bool {
		switch {
		case result[i].ConnectedAt == nil && result[j].ConnectedAt == nil:
			return result[i].SessionID < result[j].SessionID
		case result[i].ConnectedAt == nil:
			return false
		case result[j].ConnectedAt == nil:
			return true
		default:
			return result[i].ConnectedAt.After(*result[j].ConnectedAt)
		}
	})

	return result
}

func (r *ConnectionRegistry) Publish(sessionID string, event StreamEvent) bool {
	r.mu.RLock()
	conn, ok := r.sessions[sessionID]
	r.mu.RUnlock()
	if !ok {
		return false
	}

	select {
	case conn.Events <- event:
		return true
	default:
		return false
	}
}

func (r *ConnectionRegistry) removeUserSessionLocked(userID uint, sessionID string) {
	sessions, ok := r.userSessions[userID]
	if !ok {
		return
	}
	delete(sessions, sessionID)
	if len(sessions) == 0 {
		delete(r.userSessions, userID)
	}
}

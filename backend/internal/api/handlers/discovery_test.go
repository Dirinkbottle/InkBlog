package handlers

import (
	"encoding/json"
	"encoding/xml"
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func discoveryMockDB(t *testing.T) sqlmock.Sqlmock {
	t.Helper()
	connection, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	db, err := gorm.Open(postgres.New(postgres.Config{Conn: connection}), &gorm.Config{DisableAutomaticPing: true})
	if err != nil {
		t.Fatal(err)
	}
	previous := database.DB
	database.DB = db
	t.Cleanup(func() {
		database.DB = previous
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Error(err)
		}
		connection.Close()
	})
	return mock
}

func TestPublicListCannotRequestDrafts(t *testing.T) {
	for _, status := range []string{"draft", "published", "", "deleted"} {
		t.Run(status, func(t *testing.T) {
			mock := discoveryMockDB(t)
			mock.ExpectQuery(`SELECT count\(\*\) FROM "posts" WHERE posts.status = \$1 AND "posts"\."deleted_at" IS NULL`).WithArgs("published").WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
			mock.ExpectQuery(`SELECT \* FROM "posts" WHERE posts.status = \$1 AND "posts"\."deleted_at" IS NULL ORDER BY posts.created_at DESC, posts.id DESC LIMIT 10`).WithArgs("published").WillReturnRows(sqlmock.NewRows([]string{"id"}))
			recorder := httptest.NewRecorder()
			context, _ := gin.CreateTestContext(recorder)
			context.Request = httptest.NewRequest("GET", "/api/v1/posts?status="+status, nil)
			GetPostList(context)
			if recorder.Code != 200 {
				t.Fatalf("got %d: %s", recorder.Code, recorder.Body.String())
			}
		})
	}
}

func TestPublicListRejectsInvalidArchiveFilters(t *testing.T) {
	for _, query := range []string{"year=10000", "year=abc", "month=13", "year=1969", "month=-1"} {
		t.Run(query, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			context, _ := gin.CreateTestContext(recorder)
			context.Request = httptest.NewRequest("GET", "/api/v1/posts?"+query, nil)
			GetPostList(context)
			if recorder.Code != 400 {
				t.Fatalf("got %d", recorder.Code)
			}
		})
	}
}

func TestArchivesOnlyAggregatePublishedUndeletedPosts(t *testing.T) {
	mock := discoveryMockDB(t)
	mock.ExpectQuery(`SELECT EXTRACT\(YEAR.*FROM "posts" WHERE status = \$1 AND "posts"\."deleted_at" IS NULL GROUP BY year, month ORDER BY year DESC, month DESC`).WithArgs("published").WillReturnRows(sqlmock.NewRows([]string{"year", "month", "count"}).AddRow(2026, 10, 5).AddRow(2026, 9, 3))
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest("GET", "/api/v1/archives", nil)
	GetArchives(context)
	var response struct {
		Data struct {
			Total  int            `json:"total"`
			Months []archiveMonth `json:"months"`
		} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if recorder.Code != 200 || response.Data.Total != 8 || len(response.Data.Months) != 2 {
		t.Fatal(recorder.Body.String())
	}
}

func TestFeedEscapesMarkupAndKeepsCanonicalLinks(t *testing.T) {
	published := time.Date(2026, 10, 21, 14, 0, 0, 0, time.UTC)
	body, err := renderFeed([]model.PostListResponse{{ID: 42, Title: "A & B <script>", Summary: "<img onerror='bad'> & notes", PublishedAt: &published, Category: &model.Category{Name: "Code & life"}}}, "https://blog.example/", "My <blog>", "A & B")
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(body), "<script>") || strings.Contains(string(body), "<img onerror") {
		t.Fatalf("unescaped XML: %s", body)
	}
	var feed rssDocument
	if err := xml.Unmarshal(body, &feed); err != nil {
		t.Fatal(err)
	}
	if feed.Channel.Items[0].Link != "https://blog.example/posts/42" {
		t.Fatal(feed.Channel.Items[0].Link)
	}
	if feed.Channel.Items[0].Title != "A & B <script>" {
		t.Fatal("title lost during XML roundtrip")
	}
	if feed.Channel.Items[0].PubDate != published.Format(time.RFC1123Z) {
		t.Fatal("publication time lost")
	}
}

func TestSettingsEndpointDoesNotExposeCredentials(t *testing.T) {
	for _, admin := range []bool{false, true} {
		t.Run(map[bool]string{false: "public", true: "admin"}[admin], func(t *testing.T) {
			mock := discoveryMockDB(t)
			mock.ExpectQuery(`SELECT \* FROM "settings" WHERE "settings"\."id" = \$1 ORDER BY "settings"\."id" LIMIT 1`).WithArgs(1).WillReturnRows(sqlmock.NewRows([]string{"id", "value"}).AddRow(1, `{"site_name":"Garden","hero_title":"Hello","email_verification_enabled":"true","email_smtp_password":"private-test-value","email_smtp_username":"private-user","service_api_key":"private-key"}`))
			recorder := httptest.NewRecorder()
			context, _ := gin.CreateTestContext(recorder)
			context.Request = httptest.NewRequest("GET", "/api/v1/settings", nil)
			if admin {
				AdminGetSettings(context)
			} else {
				GetSettings(context)
			}
			if recorder.Code != 200 {
				t.Fatal(recorder.Body.String())
			}
			var response struct {
				Data map[string]string `json:"data"`
			}
			if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
				t.Fatal(err)
			}
			if response.Data["site_name"] != "Garden" || response.Data["email_verification_enabled"] != "true" {
				t.Fatal("public settings disappeared")
			}
			_, exposesSecret := response.Data["email_smtp_password"]
			if exposesSecret != admin {
				t.Fatal("credential visibility does not match endpoint")
			}
			if !admin && strings.Contains(recorder.Body.String(), "private-") {
				t.Fatal("private settings leaked")
			}
		})
	}
}

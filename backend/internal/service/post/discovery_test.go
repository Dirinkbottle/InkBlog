package post

import (
	"github.com/DATA-DOG/go-sqlmock"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"strings"
	"testing"
	"time"
)

func TestDiscoveryOrderingAndHalfOpenDateWindows(t *testing.T) {
	db, err := gorm.Open(postgres.New(postgres.Config{DSN: "host=localhost user=test dbname=test"}), &gorm.Config{DryRun: true, DisableAutomaticPing: true})
	if err != nil {
		t.Fatal(err)
	}
	for _, scenario := range []struct {
		name, sort, order string
		year, month       int
		start, end        time.Time
	}{
		{"popular", "popular", "posts.views DESC", 2026, 0, time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC), time.Date(2027, 1, 1, 0, 0, 0, 0, time.UTC)},
		{"leap month", "oldest", "COALESCE(posts.published_at, posts.created_at) ASC", 2024, 2, time.Date(2024, 2, 1, 0, 0, 0, 0, time.UTC), time.Date(2024, 3, 1, 0, 0, 0, 0, time.UTC)},
		{"year boundary", "newest", "COALESCE(posts.published_at, posts.created_at) DESC", 2026, 12, time.Date(2026, 12, 1, 0, 0, 0, 0, time.UTC), time.Date(2027, 1, 1, 0, 0, 0, 0, time.UTC)},
	} {
		t.Run(scenario.name, func(t *testing.T) {
			statement := applyPublicationWindow(db.Model(&model.Post{}), PostQuery{Year: scenario.year, Month: scenario.month}).Order(postListOrder(scenario.sort)).Find(&[]model.Post{}).Statement
			sql := statement.SQL.String()
			if !strings.Contains(sql, scenario.order) || !strings.Contains(sql, "posts.id") || !strings.Contains(sql, ">= $1") || !strings.Contains(sql, "< $2") {
				t.Fatal(sql)
			}
			if statement.Vars[0] != scenario.start || statement.Vars[1] != scenario.end {
				t.Fatal(statement.Vars)
			}
		})
	}
	for _, sort := range []string{"", "views; DROP TABLE posts", "random()"} {
		if postListOrder(sort) != "posts.created_at DESC, posts.id DESC" {
			t.Fatal("untrusted sort reached SQL")
		}
	}
}

func TestAdminListRetainsDraftAccessAndDefaultOrder(t *testing.T) {
	connection, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer connection.Close()
	db, err := gorm.Open(postgres.New(postgres.Config{Conn: connection}), &gorm.Config{DisableAutomaticPing: true})
	if err != nil {
		t.Fatal(err)
	}
	previous := database.DB
	database.DB = db
	defer func() { database.DB = previous }()
	mock.ExpectQuery(`SELECT count\(\*\) FROM "posts" WHERE posts.status = \$1`).WithArgs("draft").WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
	mock.ExpectQuery(`SELECT \* FROM "posts" WHERE posts.status = \$1.*ORDER BY posts.created_at DESC, posts.id DESC LIMIT 10`).WithArgs("draft").WillReturnRows(sqlmock.NewRows([]string{"id"}))
	result, err := GetPostList(PostQuery{Status: "draft"})
	if err != nil {
		t.Fatal(err)
	}
	if result.Page != 1 || result.PageSize != 10 {
		t.Fatal("legacy pagination defaults changed")
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

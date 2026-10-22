package handlers

import (
	"encoding/xml"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/internal/service"
	"inkblog-backend/pkg/utils"
)

type archiveMonth struct {
	Year  int   `json:"year"`
	Month int   `json:"month"`
	Count int64 `json:"count"`
}

// Aggregate in SQL without loading article bodies. EXTRACT works with both
// supported database engines, MySQL and PostgreSQL.
func GetArchives(c *gin.Context) {
	months := make([]archiveMonth, 0)
	err := database.GetDB().Model(&model.Post{}).
		Select("EXTRACT(YEAR FROM COALESCE(published_at, created_at)) AS year, EXTRACT(MONTH FROM COALESCE(published_at, created_at)) AS month, COUNT(*) AS count").
		Where("status = ?", "published").Group("year, month").Order("year DESC, month DESC").Scan(&months).Error
	if err != nil {
		utils.InternalServerError(c, "归档加载失败")
		return
	}
	var total int64
	for _, month := range months {
		total += month.Count
	}
	utils.Success(c, gin.H{"months": months, "total": total})
}

type rssDocument struct {
	XMLName xml.Name   `xml:"rss"`
	Version string     `xml:"version,attr"`
	Channel rssChannel `xml:"channel"`
}
type rssChannel struct {
	Title       string    `xml:"title"`
	Link        string    `xml:"link"`
	Description string    `xml:"description"`
	Language    string    `xml:"language"`
	Items       []rssItem `xml:"item"`
}
type rssItem struct {
	Title       string   `xml:"title"`
	Link        string   `xml:"link"`
	GUID        string   `xml:"guid"`
	Description string   `xml:"description"`
	PubDate     string   `xml:"pubDate,omitempty"`
	Categories  []string `xml:"category"`
}

func renderFeed(posts []model.PostListResponse, siteURL, title, description string) ([]byte, error) {
	feed := rssDocument{Version: "2.0", Channel: rssChannel{Title: title, Link: siteURL, Description: description, Language: "zh-CN"}}
	for _, post := range posts {
		link := fmt.Sprintf("%s/posts/%d", strings.TrimRight(siteURL, "/"), post.ID)
		published := post.CreatedAt
		if post.PublishedAt != nil {
			published = *post.PublishedAt
		}
		item := rssItem{Title: post.Title, Link: link, GUID: link, Description: html.EscapeString(post.Summary), PubDate: published.Format(time.RFC1123Z)}
		if post.Category != nil {
			item.Categories = append(item.Categories, post.Category.Name)
		}
		for _, tag := range post.Tags {
			item.Categories = append(item.Categories, tag.Name)
		}
		feed.Channel.Items = append(feed.Channel.Items, item)
	}
	body, err := xml.MarshalIndent(feed, "", "  ")
	if err != nil {
		return nil, err
	}
	return append([]byte(xml.Header), body...), nil
}

func GetFeed(c *gin.Context) {
	result, err := service.GetPostList(service.PostQuery{Page: 1, PageSize: 50, Status: "published", Sort: "newest"})
	if err != nil {
		utils.InternalServerError(c, "订阅暂时不可用")
		return
	}
	settings, _ := service.GetAllSettings()
	siteURL := strings.TrimRight(settings["site_url"], "/")
	parsed, parseErr := url.Parse(siteURL)
	if parseErr != nil || parsed.Host == "" || (parsed.Scheme != "https" && parsed.Scheme != "http") || parsed.RawQuery != "" || parsed.Fragment != "" || parsed.User != nil {
		scheme := "http"
		if c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https" {
			scheme = "https"
		}
		siteURL = scheme + "://" + c.Request.Host
	}
	title := settings["site_name"]
	if title == "" {
		title = "InkBlog"
	}
	body, err := renderFeed(result.Posts, siteURL, title, settings["site_description"])
	if err != nil {
		utils.InternalServerError(c, "订阅生成失败")
		return
	}
	c.Header("Cache-Control", "public, max-age=300")
	c.Data(http.StatusOK, "application/rss+xml; charset=utf-8", body)
}

package admin

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/model"
	"inkblog-backend/internal/service"
	"inkblog-backend/pkg/config"
	"inkblog-backend/pkg/utils"
)

// UploadImage 上传图片
func UploadImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		utils.BadRequest(c, "文件上传失败: "+err.Error())
		return
	}

	if file.Size > config.AppConfig.Upload.MaxSize {
		utils.BadRequest(c, "文件大小超过限制")
		return
	}

	contentType := file.Header.Get("Content-Type")
	allowed := false
	for _, allowedType := range config.AppConfig.Upload.AllowedTypes {
		if contentType == allowedType {
			allowed = true
			break
		}
	}
	if !allowed {
		utils.BadRequest(c, "不支持的文件类型")
		return
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)

	uploadPath := config.AppConfig.Upload.Path
	if err := os.MkdirAll(uploadPath, 0755); err != nil {
		utils.InternalServerError(c, "创建上传目录失败")
		return
	}

	filepath := filepath.Join(uploadPath, filename)
	if err := c.SaveUploadedFile(file, filepath); err != nil {
		utils.InternalServerError(c, "文件保存失败")
		return
	}

	fileURL := fmt.Sprintf("/uploads/%s", filename)
	utils.Success(c, gin.H{
		"url": fileURL,
	})
}

// UploadImageFromEditor Toast UI Editor 图片上传
func UploadImageFromEditor(c *gin.Context) {
	utils.Info("Received editor image upload request")
	file, err := c.FormFile("image")
	if err != nil {
		utils.Error("Failed to get form file 'image': %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "文件上传失败: " + err.Error(),
		})
		return
	}
	utils.Info("File received: %s, size: %d bytes", file.Filename, file.Size)

	if config.AppConfig == nil {
		utils.Error("AppConfig is nil")
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "服务器配置未加载",
		})
		return
	}

	if file.Size > config.AppConfig.Upload.MaxSize {
		utils.Error("File size %d exceeds limit %d", file.Size, config.AppConfig.Upload.MaxSize)
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "文件大小超过限制",
		})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "文件读取失败",
		})
		return
	}
	defer src.Close()

	buffer := make([]byte, 512)
	_, err = src.Read(buffer)
	if err != nil && err != io.EOF {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "文件读取失败",
		})
		return
	}
	contentType := http.DetectContentType(buffer)
	utils.Info("Detected content type: %s", contentType)

	src.Seek(0, 0)

	allowed := false
	allowedTypes := config.AppConfig.Upload.AllowedTypes
	if len(allowedTypes) == 0 {
		allowedTypes = []string{"image/jpeg", "image/png", "image/gif", "image/webp"}
		utils.Warn("No allowed types configured, using defaults: %v", allowedTypes)
	}
	
	for _, allowedType := range allowedTypes {
		if strings.HasPrefix(contentType, allowedType) {
			allowed = true
			break
		}
	}
	if !allowed {
		utils.Error("File type %s not allowed. Allowed types: %v", contentType, allowedTypes)
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "不支持的文件类型: " + contentType,
		})
		return
	}

	ext := filepath.Ext(file.Filename)
	if ext == "" {
		ext = ".png"
		utils.Warn("No file extension detected, using default: %s", ext)
	}
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)

	uploadPath := config.AppConfig.Upload.Path
	utils.Info("Upload path: %s", uploadPath)
	if err := os.MkdirAll(uploadPath, 0755); err != nil {
		utils.Error("Failed to create upload directory: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "创建上传目录失败: " + err.Error(),
		})
		return
	}

	filePath := filepath.Join(uploadPath, filename)
	utils.Info("Saving file to: %s", filePath)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		utils.Error("Failed to save file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "文件保存失败: " + err.Error(),
		})
		return
	}

	fileURL := fmt.Sprintf("/uploads/%s", filename)
	utils.Info("File uploaded successfully: %s", fileURL)
	
	userID, exists := c.Get("user_id")
	if exists {
		attachment := model.Attachment{
			UserID:   userID.(uint),
			FileName: file.Filename,
			FileURL:  fileURL,
			FileSize: file.Size,
			FileType: contentType,
			PostID:   nil,
		}
		if err := service.CreateAttachment(&attachment); err != nil {
			utils.Warn("Failed to save attachment record: %v", err)
		} else {
			utils.Info("Attachment record saved for user %d", userID)
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"url": fileURL,
	})
	utils.Info("Upload response sent successfully")
}

package service

import (
	"errors"
	"os"

	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
)

// CreateAttachment 创建附件记录
func CreateAttachment(attachment *model.Attachment) error {
	db := database.GetDB()
	return db.Create(attachment).Error
}

// GetAttachmentsByPostID 获取文章的所有附件
func GetAttachmentsByPostID(postID uint) ([]model.Attachment, error) {
	db := database.GetDB()
	var attachments []model.Attachment
	
	err := db.Where("post_id = ?", postID).
		Order("created_at DESC").
		Find(&attachments).Error
	
	return attachments, err
}

// GetAttachmentByID 根据ID获取附件
func GetAttachmentByID(id uint) (*model.Attachment, error) {
	db := database.GetDB()
	var attachment model.Attachment
	
	err := db.First(&attachment, id).Error
	if err != nil {
		return nil, err
	}
	
	return &attachment, nil
}

// DeleteAttachment 删除附件（同时删除物理文件）
func DeleteAttachment(id uint, userID uint, isAdmin bool) error {
	db := database.GetDB()
	
	// 获取附件信息
	attachment, err := GetAttachmentByID(id)
	if err != nil {
		return err
	}
	
	// 权限检查：非管理员只能删除自己的附件
	if !isAdmin && attachment.UserID != userID {
		return errors.New("无权删除此附件")
	}
	
	// 删除数据库记录
	if err := db.Delete(&model.Attachment{}, id).Error; err != nil {
		return err
	}
	
	// 删除物理文件（忽略错误，因为文件可能已经不存在）
	// file_url 格式: /uploads/filename.jpg，需要转换为实际路径
	filePath := "." + attachment.FileURL
	os.Remove(filePath)
	
	return nil
}


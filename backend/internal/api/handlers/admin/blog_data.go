package admin

import (
	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/service"
	"inkblog-backend/pkg/utils"
)

func GetBlogDataOverview(c *gin.Context) {
	overview, err := service.GetBlogDataOverview(service.BlogTrendRangeDays, service.BlogRecentPostLimit)
	if err != nil {
		utils.InternalServerError(c, "博客数据加载失败: "+err.Error())
		return
	}

	utils.Success(c, overview)
}

package utils

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"html/template"

	"github.com/jordan-wright/email"
	"gopkg.in/gomail.v2"
)

type EmailConfig struct {
	SMTPHost    string
	SMTPPort    int
	Username    string
	Password    string
	FromAddress string
	FromName    string
	Library     string
}

// SendEmailWithGomail 使用gomail发送邮件
func SendEmailWithGomail(config *EmailConfig, to, subject, htmlBody string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", fmt.Sprintf("%s <%s>", config.FromName, config.FromAddress))
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", htmlBody)

	d := gomail.NewDialer(config.SMTPHost, config.SMTPPort, config.Username, config.Password)
	d.TLSConfig = &tls.Config{InsecureSkipVerify: true}

	return d.DialAndSend(m)
}

// SendEmailWithJordanWright 使用jordan-wright/email发送邮件
func SendEmailWithJordanWright(config *EmailConfig, to, subject, htmlBody string) error {
	e := email.NewEmail()
	e.From = fmt.Sprintf("%s <%s>", config.FromName, config.FromAddress)
	e.To = []string{to}
	e.Subject = subject
	e.HTML = []byte(htmlBody)

	addr := fmt.Sprintf("%s:%d", config.SMTPHost, config.SMTPPort)
	return e.SendWithTLS(addr, nil, &tls.Config{
		ServerName:         config.SMTPHost,
		InsecureSkipVerify: true,
	})
}

// SendEmail 发送邮件（根据配置选择库）
func SendEmail(config *EmailConfig, to, subject, htmlBody string) error {
	if config.Library == "email" {
		return SendEmailWithJordanWright(config, to, subject, htmlBody)
	}
	return SendEmailWithGomail(config, to, subject, htmlBody)
}

// SendVerificationEmail 发送验证邮件
func SendVerificationEmail(config *EmailConfig, username, emailAddr, token, baseURL string, expiryHours int) error {
	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", baseURL, token)

	htmlTemplate := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; 
                  color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .info-box { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>欢迎加入 InkBlog</h1>
        </div>
        <div class="content">
            <h2>您好，{{.Username}}！</h2>
            <p>感谢您注册 InkBlog。请点击下面的按钮验证您的邮箱地址：</p>
            
            <div class="info-box">
                <strong>用户名：</strong> {{.Username}}<br>
                <strong>邮箱：</strong> {{.Email}}
            </div>
            
            <div style="text-align: center;">
                <a href="{{.VerifyURL}}" class="button">验证邮箱</a>
            </div>
            
            <p>或者复制以下链接到浏览器：</p>
            <p style="word-break: break-all; color: #667eea;">{{.VerifyURL}}</p>
            
            <p style="color: #999; font-size: 14px;">
                此链接将在 {{.ExpiryHours}} 小时后失效。如果您没有注册 InkBlog，请忽略此邮件。
            </p>
        </div>
        <div class="footer">
            <p>© 2025 InkBlog. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`

	tmpl, err := template.New("verification").Parse(htmlTemplate)
	if err != nil {
		return err
	}

	var body bytes.Buffer
	data := struct {
		Username    string
		Email       string
		VerifyURL   string
		ExpiryHours int
	}{
		Username:    username,
		Email:       emailAddr,
		VerifyURL:   verifyURL,
		ExpiryHours: expiryHours,
	}

	if err := tmpl.Execute(&body, data); err != nil {
		return err
	}

	return SendEmail(config, emailAddr, "验证您的 InkBlog 账户", body.String())
}


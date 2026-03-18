package utils

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"time"
)

type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARN
	ERROR
)

var (
	logFile   *os.File
	logger    *log.Logger
	logLevel  = INFO
	logColors = map[LogLevel]string{
		DEBUG: "\033[36m", // Cyan
		INFO:  "\033[32m", // Green
		WARN:  "\033[33m", // Yellow
		ERROR: "\033[31m", // Red
	}
	resetColor = "\033[0m"
)

// InitLogger 初始化日志系统
func InitLogger(logPath string) error {
	// 创建日志目录
	logDir := filepath.Dir(logPath)
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return fmt.Errorf("failed to create log directory: %w", err)
	}

	// 打开日志文件
	var err error
	logFile, err = os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return fmt.Errorf("failed to open log file: %w", err)
	}

	// 创建logger（同时输出到控制台和文件）
	logger = log.New(os.Stdout, "", 0)

	return nil
}

// SetLogLevel 设置日志级别
func SetLogLevel(level string) {
	switch level {
	case "debug":
		logLevel = DEBUG
	case "info":
		logLevel = INFO
	case "warn":
		logLevel = WARN
	case "error":
		logLevel = ERROR
	default:
		logLevel = INFO
	}
}

// GetCaller 获取调用者信息
func getCaller(skip int) string {
	_, file, line, ok := runtime.Caller(skip)
	if !ok {
		return "unknown:0"
	}
	return fmt.Sprintf("%s:%d", filepath.Base(file), line)
}

// Log 通用日志函数
func logMessage(level LogLevel, format string, args ...interface{}) {
	if level < logLevel {
		return
	}

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	caller := getCaller(3)
	levelStr := getLevelString(level)
	message := fmt.Sprintf(format, args...)

	// 控制台输出（带颜色）
	color := logColors[level]
	consoleMsg := fmt.Sprintf("%s[%s]%s [%s] %s - %s",
		color, levelStr, resetColor, timestamp, caller, message)
	fmt.Println(consoleMsg)

	// 文件输出（不带颜色）
	if logFile != nil {
		fileMsg := fmt.Sprintf("[%s] [%s] %s - %s\n",
			levelStr, timestamp, caller, message)
		logFile.WriteString(fileMsg)
	}
}

func getLevelString(level LogLevel) string {
	switch level {
	case DEBUG:
		return "DEBUG"
	case INFO:
		return "INFO"
	case WARN:
		return "WARN"
	case ERROR:
		return "ERROR"
	default:
		return "UNKNOWN"
	}
}

// Debug 调试日志
func Debug(format string, args ...interface{}) {
	logMessage(DEBUG, format, args...)
}

// Info 信息日志
func Info(format string, args ...interface{}) {
	logMessage(INFO, format, args...)
}

// Warn 警告日志
func Warn(format string, args ...interface{}) {
	logMessage(WARN, format, args...)
}

// Error 错误日志
func Error(format string, args ...interface{}) {
	logMessage(ERROR, format, args...)
}

// CloseLogger 关闭日志文件
func CloseLogger() {
	if logFile != nil {
		logFile.Close()
	}
}


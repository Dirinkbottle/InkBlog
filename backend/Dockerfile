# 构建阶段
FROM docker.1ms.run/golang:1.21-alpine AS builder

WORKDIR /app

ARG GOPROXY=https://goproxy.cn,direct
ARG GOSUMDB=sum.golang.google.cn
ENV GOPROXY=${GOPROXY}
ENV GOSUMDB=${GOSUMDB}

# 复制依赖文件
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/main.go
RUN CGO_ENABLED=0 GOOS=linux go build -o notification ./cmd/notification

# 运行阶段
FROM docker.1ms.run/alpine:latest

WORKDIR /app

# 安装必要的运行时依赖
RUN apk --no-cache add ca-certificates tzdata wget

# 设置时区
ENV TZ=Asia/Shanghai

# 复制二进制文件和配置
COPY --from=builder /app/main .
COPY --from=builder /app/notification .
COPY --from=builder /app/config.yaml .
COPY --from=builder /app/scripts ./scripts

# 创建运行目录
RUN mkdir -p /app/uploads /app/logs /app/runtime

# 暴露端口
EXPOSE 13150 13160

# 运行应用
CMD ["./main"]


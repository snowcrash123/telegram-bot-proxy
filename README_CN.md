# Telegram Bot Proxy

这是一个简单的 Node.js 代理服务，用于转发图片到 Telegram Bot，并附加客户端的 IP 和地理位置信息。

## 功能

- 接收 `multipart/form-data` 格式的图片上传。
- 获取客户端 IP 地址。
- 查询 IP 对应的国家、城市和 ISP 信息。
- 获取客户端操作系统版本（通过 Header `x-os-version`）。
- 将图片和附加信息转发给指定的 Telegram Bot。

## 部署到 Railway

点击下方按钮一键部署到 Railway：

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/horizontalsystems/telegram-bot-proxy&envs=TELEGRAM_BOT_TOKEN,TELEGRAM_CHAT_ID)

*(注意：你需要将此仓库推送到 GitHub 才能使用上述按钮，或者直接在 Railway 中选择 "New Project" -> "Deploy from GitHub repo")*

## 环境变量

部署时需要配置以下环境变量：

- `TELEGRAM_BOT_TOKEN`: 你的 Telegram Bot Token。
- `TELEGRAM_CHAT_ID`: 接收消息的 Chat ID。
- `PORT`: (可选) 服务端口，默认为 3000。

## 本地运行

1. 安装依赖：
   ```bash
   npm install
   ```

2. 配置环境变量：
   复制 `.env.example` 为 `.env` 并填入你的配置。

3. 启动服务：
   ```bash
   node index.js
   ```

## API 文档

### 1. 发送文本消息

转发文本消息到 Telegram，并自动附加客户端 IP、地理位置和 OS 版本信息。

- **URL**: `/sendMessage`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### 请求头 (Headers)

| Key | Value | 说明 |
| --- | --- | --- |
| `x-os-version` | String | (可选) 客户端操作系统版本，例如 `Android 13` |

#### 请求体 (Body)

```json
{
  "text": "Hello from Proxy!"
}
```

#### 示例 (cURL)

```bash
curl -X POST https://your-proxy-url.app/sendMessage \
     -H "Content-Type: application/json" \
     -H "x-os-version: Android 14" \
     -d '{"text": "User logged in"}'
```

---

### 2. 发送图片

转发图片到 Telegram，支持附带标题 (Caption)，同样会自动附加客户端信息。

- **URL**: `/sendPhoto`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`

#### 请求头 (Headers)

| Key | Value | 说明 |
| --- | --- | --- |
| `x-os-version` | String | (可选) 客户端操作系统版本 |

#### 请求体 (Form Data)

| Key | Type | 说明 |
| --- | --- | --- |
| `photo` | File | **(必填)** 要上传的图片文件 |
| `caption` | String | (可选) 图片标题 |

#### 示例 (cURL)

```bash
curl -X POST https://your-proxy-url.app/sendPhoto \
     -H "x-os-version: iOS 17.2" \
     -F "photo=@/path/to/image.jpg" \
     -F "caption=Screenshot detected"
```

## 响应格式

成功请求将返回 JSON 格式的响应：

```json
{
  "success": true,
  "telegram_response": {
    "ok": true,
    "result": {
      "message_id": 123,
      ...
    }
  }
}
```

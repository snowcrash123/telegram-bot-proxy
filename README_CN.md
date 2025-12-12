# Telegram Bot Proxy

这是一个简单的 Cloudflare Worker 服务，用于转发图片到 Telegram Bot，并附加客户端的 IP 和地理位置信息。

## 功能

- 接收 `multipart/form-data` 格式的图片上传。
- 获取客户端 IP 地址。
- 查询 IP 对应的国家、城市和 ISP 信息。
- 获取客户端操作系统版本（通过 Header `x-os-version`）。
- 将图片和附加信息转发给指定的 Telegram Bot。

## 部署到 Cloudflare Workers

1. **安装 Wrangler** (Cloudflare CLI):
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**:
   ```bash
   wrangler login
   ```

3. **克隆项目并安装依赖**:
   ```bash
   git clone https://github.com/horizontalsystems/telegram-bot-proxy.git
   cd telegram-bot-proxy
   npm install
   ```

4. **配置密钥 (Secrets)**:
   在 Cloudflare 中设置你的 Telegram Bot 密钥：
   ```bash
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put TELEGRAM_CHAT_ID
   ```

5. **部署**:
   ```bash
   npm run deploy
   ```

## 本地运行

1. 安装依赖：
   ```bash
   npm install
   ```

2. 启动本地开发服务器：
   ```bash
   npx wrangler dev
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
curl -X POST https://your-worker.workers.dev/sendMessage \
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
curl -X POST https://your-worker.workers.dev/sendPhoto \
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


# Telegram Bot Proxy

[中文文档](README_CN.md)

A simple Cloudflare Worker service that forwards images and messages to a Telegram Bot, attaching the client's IP address and geolocation information.

## Features

- Accepts image uploads in `multipart/form-data` format.
- Retrieves client IP address.
- Queries IP geolocation (Country, City, ISP).
- Retrieves client OS version (via `x-os-version` Header).
- Forwards the image/message with attached metadata to a specified Telegram Bot.

## Deploy on Cloudflare Workers

1. **Install Wrangler** (Cloudflare CLI):
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Clone and Install Dependencies**:
   ```bash
   git clone https://github.com/horizontalsystems/telegram-bot-proxy.git
   cd telegram-bot-proxy
   npm install
   ```

4. **Configure Secrets**:
   Set your Telegram Bot secrets in Cloudflare:
   ```bash
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put TELEGRAM_CHAT_ID
   ```

5. **Deploy**:
   ```bash
   npm run deploy
   ```

## Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local development server:
   ```bash
   npx wrangler dev
   ```
   
   To test with secrets locally, create a `.dev.vars` file or pass them as arguments if needed (or rely on remote secrets with `--remote` if applicable, though local dev usually suggests `.dev.vars`).

## API Documentation

### 1. Send Text Message

Forwards a text message to Telegram, automatically attaching client IP, location, and OS version.

- **URL**: `/sendMessage`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Headers

| Key | Value | Description |
| --- | --- | --- |
| `x-os-version` | String | (Optional) Client OS version, e.g., `Android 13` |

#### Body

```json
{
  "text": "Hello from Proxy!"
}
```

#### Example (cURL)

```bash
curl -X POST https://your-worker.workers.dev/sendMessage \
     -H "Content-Type: application/json" \
     -H "x-os-version: Android 14" \
     -d '{"text": "User logged in"}'
```

---

### 2. Send Photo

Forwards a photo to Telegram, supports an optional caption, and automatically attaches client info.

- **URL**: `/sendPhoto`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`

#### Headers

| Key | Value | Description |
| --- | --- | --- |
| `x-os-version` | String | (Optional) Client OS version |

#### Body (Form Data)

| Key | Type | Description |
| --- | --- | --- |
| `photo` | File | **(Required)** The image file to upload |
| `caption` | String | (Optional) Image caption |

#### Example (cURL)

```bash
curl -X POST https://your-worker.workers.dev/sendPhoto \
     -H "x-os-version: iOS 17.2" \
     -F "photo=@/path/to/image.jpg" \
     -F "caption=Screenshot detected"
```

## Response Format

Successful requests return a JSON response:

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

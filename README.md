# Telegram Bot Proxy

[中文文档](README_CN.md)

A simple Node.js proxy service that forwards images and messages to a Telegram Bot, attaching the client's IP address and geolocation information.

## Features

- Accepts image uploads in `multipart/form-data` format.
- Retrieves client IP address.
- Queries IP geolocation (Country, City, ISP).
- Retrieves client OS version (via `x-os-version` Header).
- Forwards the image/message with attached metadata to a specified Telegram Bot.

## Deploy on Railway

Click the button below to deploy on Railway:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/horizontalsystems/telegram-bot-proxy&envs=TELEGRAM_BOT_TOKEN,TELEGRAM_CHAT_ID)

*(Note: You need to push this repository to GitHub to use the button above, or select "New Project" -> "Deploy from GitHub repo" directly in Railway)*

## Environment Variables

The following environment variables are required for deployment:

- `TELEGRAM_BOT_TOKEN`: Your Telegram Bot Token.
- `TELEGRAM_CHAT_ID`: The Chat ID to receive messages.
- `PORT`: (Optional) Service port, defaults to 3000.

## Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your configuration.

3. Start the service:
   ```bash
   node index.js
   ```

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
curl -X POST https://your-proxy-url.app/sendMessage \
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
curl -X POST https://your-proxy-url.app/sendPhoto \
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

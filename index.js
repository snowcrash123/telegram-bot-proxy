const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const cors = require('cors');
require('dotenv').config();

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 获取 IP 信息的辅助函数
async function getIpInfo(ip) {
    try {
        // 如果是本地 IP，直接返回
        if (ip === '::1' || ip === '127.0.0.1') {
            return { country: 'Localhost', city: 'Localhost' };
        }
        // 使用 ip-api.com 获取信息 (免费版，有速率限制)
        const response = await axios.get(`http://ip-api.com/json/${ip}`);
        if (response.data.status === 'success') {
            return {
                country: response.data.country,
                city: response.data.city,
                isp: response.data.isp
            };
        }
    } catch (error) {
        console.error('Error fetching IP info:', error.message);
    }
    return { country: 'Unknown', city: 'Unknown' };
}

app.get('/', (req, res) => {
    res.send('Telegram Proxy Service is running.');
});

// 构建附加信息的辅助函数
async function buildMetaInfo(req) {
    // 1. 获取客户端 IP
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (clientIp && clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
    }

    // 2. 获取 IP 详细信息
    const ipInfo = await getIpInfo(clientIp);

    // 3. 获取 OS 版本 (从 Header 或 Body)
    const osVersion = req.headers['x-os-version'] || req.body.osVersion || 'Unknown OS';

    return `
--- Client Info ---
IP: ${clientIp}
Location: ${ipInfo.country}, ${ipInfo.city}
ISP: ${ipInfo.isp}
OS: ${osVersion}
`;
}

app.post('/sendMessage', async (req, res) => {
    try {
        const originalText = req.body.text || '';
        const metaInfo = await buildMetaInfo(req);
        const newText = `${originalText}\n${metaInfo}`;

        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await axios.post(telegramUrl, {
            chat_id: TELEGRAM_CHAT_ID,
            text: newText
        });

        res.json({ success: true, telegram_response: response.data });
    } catch (error) {
        console.error('Error forwarding message to Telegram:', error.message);
        if (error.response) {
            res.status(error.response.status).json({ error: error.response.data });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.post('/sendPhoto', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No photo provided' });
        }

        const originalCaption = req.body.caption || '';
        const metaInfo = await buildMetaInfo(req);
        const newCaption = `${originalCaption}\n${metaInfo}`;

        // 准备转发给 Telegram 的数据
        const formData = new FormData();
        formData.append('chat_id', TELEGRAM_CHAT_ID);
        formData.append('caption', newCaption);
        formData.append('photo', req.file.buffer, {
            filename: req.file.originalname || 'photo.jpg',
            contentType: req.file.mimetype
        });

        // 发送请求给 Telegram
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
        const telegramResponse = await axios.post(telegramUrl, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        res.json({ success: true, telegram_response: telegramResponse.data });

    } catch (error) {
        console.error('Error forwarding photo to Telegram:', error.message);
        if (error.response) {
            console.error('Telegram API Error:', error.response.data);
            res.status(error.response.status).json({ error: error.response.data });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

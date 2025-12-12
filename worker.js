export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-os-version',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Helper function to get IP info
        async function getIpInfo(ip) {
            try {
                if (ip === '::1' || ip === '127.0.0.1') {
                    return { country: 'Localhost', city: 'Localhost' };
                }
                const response = await fetch(`http://ip-api.com/json/${ip}`);
                const data = await response.json();
                if (data.status === 'success') {
                    return {
                        country: data.country,
                        city: data.city,
                        isp: data.isp
                    };
                }
            } catch (error) {
                console.error('Error fetching IP info:', error.message);
            }
            return { country: 'Unknown', city: 'Unknown' };
        }

        // Helper function to build meta info
        async function buildMetaInfo(req, body = {}) {
            let clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip');
            if (clientIp && clientIp.includes(',')) {
                clientIp = clientIp.split(',')[0].trim();
            }

            const ipInfo = await getIpInfo(clientIp);
            const osVersion = req.headers.get('x-os-version') || body.osVersion || 'Unknown OS';

            return `
--- Client Info ---
IP: ${clientIp}
Location: ${ipInfo.country}, ${ipInfo.city}
ISP: ${ipInfo.isp}
OS: ${osVersion}
`;
        }

        // Routes
        if (url.pathname === '/' && request.method === 'GET') {
            return new Response('Telegram Proxy Service is running.', {
                headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
            });
        }

        if (url.pathname === '/sendMessage' && request.method === 'POST') {
            try {
                const body = await request.json();
                const originalText = body.text || '';
                const metaInfo = await buildMetaInfo(request, body);
                const newText = `${originalText}\n${metaInfo}`;

                const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
                const telegramResponse = await fetch(telegramUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: env.TELEGRAM_CHAT_ID,
                        text: newText
                    })
                });

                const telegramData = await telegramResponse.json();

                // Return success even if telegram fails? Original code returns error if telegram fails.
                // Original: res.json({ success: true, telegram_response: response.data });
                // Original catch: returns error status.

                if (!telegramResponse.ok) {
                    return new Response(JSON.stringify({ error: telegramData }), {
                        status: telegramResponse.status,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                return new Response(JSON.stringify({ success: true, telegram_response: telegramData }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        if (url.pathname === '/sendPhoto' && request.method === 'POST') {
            try {
                const formData = await request.formData();
                const photo = formData.get('photo');

                if (!photo) {
                    return new Response(JSON.stringify({ error: 'No photo provided' }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const originalCaption = formData.get('caption') || '';

                // For meta info, we need osVersion which might be in body, but formData body is different.
                // The original code: req.body.caption || ''.
                // In multipart, other fields are in formData too.
                const bodyObj = {};
                for (const [key, value] of formData.entries()) {
                    if (typeof value === 'string') bodyObj[key] = value;
                }

                const metaInfo = await buildMetaInfo(request, bodyObj);
                const newCaption = `${originalCaption}\n${metaInfo}`;

                const telegramFormData = new FormData();
                telegramFormData.append('chat_id', env.TELEGRAM_CHAT_ID);
                telegramFormData.append('caption', newCaption);
                telegramFormData.append('photo', photo); // Forward the file directly

                const telegramUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
                const telegramResponse = await fetch(telegramUrl, {
                    method: 'POST',
                    body: telegramFormData
                });

                const telegramData = await telegramResponse.json();

                if (!telegramResponse.ok) {
                    return new Response(JSON.stringify({ error: telegramData }), {
                        status: telegramResponse.status,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                return new Response(JSON.stringify({ success: true, telegram_response: telegramData }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
};

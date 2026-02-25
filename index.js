const express = require('express');
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hata Korumalı 65 WPM Sistemi Aktif!");
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda aktif.`);
});

const TOKEN = process.env.TOKEN; 
const CHANNEL_IDS = process.env.CHANNEL_IDS;
const MESSAGE = process.env.MESSAGE;

if (!TOKEN || !CHANNEL_IDS || !MESSAGE) {
    console.error("HATA: Değişkenler eksik!");
} else {
    const channelList = CHANNEL_IDS.split(",").map(c => c.trim());
    
    async function startProcess() {
        while (true) { 
            for (const channelId of channelList) {
                try {
                    // 1. "Yazıyor..." animasyonu
                    await axios.post(
                        `https://discord.com/api/v9/channels/${channelId}/typing`,
                        {},
                        { headers: { "Authorization": TOKEN } }
                    );

                    // 2. 65 WPM Yazma Süresi
                    const typingTime = MESSAGE.length * 185;
                    await new Promise(resolve => setTimeout(resolve, typingTime));

                    // 3. Mesajı Gönder
                    await axios.post(
                        `https://discord.com/api/v9/channels/${channelId}/messages`,
                        { content: MESSAGE },
                        { headers: { "Authorization": TOKEN } }
                    );
                    console.log(`[${channelId}] ✅ Başarılı.`);

                    // 4. GÜVENLİK PAYI: Kanal değiştirmeden önce 2 saniye bekle
                    // 429 hatalarını önlemek için bu süre kritiktir.
                    await new Promise(resolve => setTimeout(resolve, 2000));

                } catch (err) {
                    if (err.response?.status === 429) {
                        // Discord "Dur" dediğinde 15 saniye mola ver
                        const retryAfter = (err.response.data.retry_after * 1000) || 15000;
                        console.error(`[${channelId}] ⚠️ Hız sınırı! ${Math.round(retryAfter/1000)}sn bekleniyor...`);
                        await new Promise(resolve => setTimeout(resolve, retryAfter));
                    } else {
                        console.error(`[${channelId}] ❌ Hata: ${err.response?.status}. 5sn sonra devam...`);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                }
            }
        }
    }
    startProcess();
}

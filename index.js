const express = require('express');
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("100 WPM Sistem Aktif - 2 Saniye Beklemeli");
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda aktif.`);
});

const TOKEN = process.env.TOKEN; 
const CHANNEL_IDS = process.env.CHANNEL_IDS;
const MESSAGE = process.env.MESSAGE;

if (!TOKEN || !CHANNEL_IDS || !MESSAGE) {
    console.error("HATA: TOKEN, CHANNEL_IDS veya MESSAGE eksik!");
} else {
    const channelList = CHANNEL_IDS.split(",").map(c => c.trim());
    
    async function startProcess() {
        console.log("Sistem başlatıldı: Kanallar arası 2 saniye bekleme eklendi.");
        
        while (true) { 
            for (const channelId of channelList) {
                try {
                    // 1. "Yazıyor..." animasyonu
                    await axios.post(
                        `https://discord.com/api/v9/channels/${channelId}/typing`,
                        {},
                        { headers: { "Authorization": TOKEN } }
                    );

                    // 2. Yazma simülasyonu (100 WPM hesabı)
                    const typingTime = MESSAGE.length * 120;
                    console.log(`[${channelId}] Yazılıyor: ${Math.round(typingTime)}ms`);
                    await new Promise(resolve => setTimeout(resolve, typingTime));

                    // 3. Mesajı Gönder
                    await axios.post(
                        `https://discord.com/api/v9/channels/${channelId}/messages`,
                        { content: MESSAGE },
                        { headers: { "Authorization": TOKEN } }
                    );

                    console.log(`[${channelId}] ✅ Mesaj Atıldı. Sonraki kanal için 2 saniye bekleniyor...`);
                    
                    // --- GÜNCELLEME: Kanallar arası 2 saniye bekleme süresi ---
                    await new Promise(resolve => setTimeout(resolve, 2000));

                } catch (err) {
                    if (err.response?.status === 429) {
                        const retryAfter = (err.response.data.retry_after * 1000) || 5000;
                        console.error(`[${channelId}] ⚠️ Rate Limit! ${Math.round(retryAfter/1000)}sn zorunlu mola.`);
                        await new Promise(resolve => setTimeout(resolve, retryAfter));
                    } else {
                        console.error(`[${channelId}] ❌ Hata: ${err.response?.status}. 2 saniye sonra devam edilecek.`);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
        }
    }
    startProcess();
}

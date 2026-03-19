const express = require('express');
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Güvenli Mod: 5 Saniye Beklemeli Sistem Aktif!");
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
        console.log("Sistem Güvenli Modda Başlatıldı: 5 saniye bekleme aktif.");
        
        while (true) { 
            for (const channelId of channelList) {
                try {
                    // Mesajı Gönder (Typing animasyonu API yükünü artırdığı için kaldırıldı)
                    await axios.post(
                        `https://discord.com/api/v9/channels/${channelId}/messages`,
                        { content: MESSAGE },
                        { headers: { "Authorization": TOKEN } }
                    );

                    console.log(`[${channelId}] ✅ Mesaj Gönderildi. 5 saniye bekleniyor...`);
                    
                    // --- GÜNCELLEME: Daha güvenli bir aralık için 5 saniye bekleme ---
                    await new Promise(resolve => setTimeout(resolve, 5000));

                } catch (err) {
                    if (err.response?.status === 429) {
                        // Discord'un verdiği tam süreyi al, üzerine 2 saniye daha ekle (garanti olsun)
                        const retryAfter = (err.response.data.retry_after * 1000) + 2000;
                        console.error(`[${channelId}] ⚠️ Rate Limit! Discord ${Math.round(retryAfter/1000)}sn mola verdi. Bekleniyor...`);
                        await new Promise(resolve => setTimeout(resolve, retryAfter));
                    } else {
                        console.error(`[${channelId}] ❌ Hata: ${err.response?.status}. 5 saniye sonra devam edilecek.`);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                }
            }
        }
    }
    startProcess();
}

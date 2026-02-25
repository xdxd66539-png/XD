const express = require('express');
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Garantili Sıralı Bot Sistemi Aktif!");
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
                let sent = false; // Mesajın gönderilip gönderilmediğini kontrol eder

                while (!sent) { // Mesaj başarıyla atılana kadar bu kanaldan ÇIKMAZ
                    try {
                        // 1. "Yazıyor..." animasyonu (65 WPM hızı korunuyor)
                        await axios.post(
                            `https://discord.com/api/v9/channels/${channelId}/typing`,
                            {},
                            { headers: { "Authorization": TOKEN } }
                        );

                        const typingTime = MESSAGE.length * 185;
                        await new Promise(resolve => setTimeout(resolve, typingTime));

                        // 2. Mesajı Gönder
                        await axios.post(
                            `https://discord.com/api/v9/channels/${channelId}/messages`,
                            { content: MESSAGE },
                            { headers: { "Authorization": TOKEN } }
                        );

                        console.log(`[${channelId}] ✅ Mesaj başarıyla atıldı. Sıradaki kanala geçiliyor...`);
                        sent = true; // Gönderildi, while döngüsü biter ve sıradaki kanala (for) geçer.

                        // Kanallar arası kısa bir güvenlik molası (Hataları önlemek için)
                        await new Promise(resolve => setTimeout(resolve, 2000));

                    } catch (err) {
                        if (err.response?.status === 429) {
                            // Hız sınırı varsa bekle ama "sent" true olmadığı için aynı kanalı tekrar deneyecek
                            const retryAfter = (err.response.data.retry_after * 1000) || 10000;
                            console.error(`[${channelId}] ⚠️ Hız sınırı! ${Math.round(retryAfter/1000)}sn sonra AYNI KANAL tekrar denenecek.`);
                            await new Promise(resolve => setTimeout(resolve, retryAfter));
                        } else {
                            console.error(`[${channelId}] ❌ Hata: ${err.response?.status}. 5sn sonra tekrar denenecek.`);
                            await new Promise(resolve => setTimeout(resolve, 5000));
                        }
                    }
                }
            }
            console.log("Listenin sonuna gelindi. Başa dönülüyor...");
        }
    }
    startProcess();
}

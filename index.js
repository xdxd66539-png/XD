const express = require('express');
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("75 WPM Hızlı İnsansı Sistem Aktif!");
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda aktif.`);
});

const TOKEN = process.env.TOKEN; 
const CHANNEL_IDS = process.env.CHANNEL_IDS;
// 3 Farklı mesaj değişkeni
const msgs = [process.env.MESSAGE1, process.env.MESSAGE2, process.env.MESSAGE3];

if (!TOKEN || !CHANNEL_IDS || !msgs[0] || !msgs[1] || !msgs[2]) {
    console.error("HATA: Değişkenler (MESSAGE 1-2-3) eksik!");
} else {
    const channelList = CHANNEL_IDS.split(",").map(c => c.trim());
    let msgIndex = 0;

    async function startProcess() {
        while (true) { 
            for (const channelId of channelList) {
                const currentMessage = msgs[msgIndex % msgs.length];

                try {
                    // 1. "Yazıyor..." animasyonu
                    await axios.post(
                        `https://discord.com/api/v9/channels/${channelId}/typing`,
                        {},
                        { headers: { "Authorization": TOKEN } }
                    );

                    // 2. 75 WPM HESABI: Harf başına 160ms bekleme
                    const typingTime = currentMessage.length * 160;
                    console.log(`[${channelId}] 75 WPM hızında yazılıyor... (${Math.round(typingTime)}ms)`);
                    
                    await new Promise(resolve => setTimeout(resolve, typingTime));

                    // 3. Mesajı Gönder
                    await axios.post(
                        `https://discord.com/api/v9/channels/${channelId}/messages`,
                        { content: currentMessage },
                        { headers: { "Authorization": TOKEN } }
                    );

                    console.log(`[${channelId}] ✅ Mesaj Atıldı. Sıradaki mesaja geçiliyor.`);
                    
                    // Mesaj başarılıysa bir sonrakine geç
                    msgIndex++;

                    // Kanal geçişi için 1.5 saniye mola
                    await new Promise(resolve => setTimeout(resolve, 1500));

                } catch (err) {
                    // HATA ALINCA: Beklemeden bu kanalı geç
                    console.error(`[${channelId}] ⚠️ Hata (${err.response?.status}). Bu kanal atlanıyor...`);
                    
                    if (err.response?.status === 429) {
                        // Rate limit varsa hesabı korumak için 7 saniye mola ver
                        await new Promise(resolve => setTimeout(resolve, 7000));
                    }
                    // Döngü otomatik olarak listedeki sonraki channelId'ye geçer.
                }
            }
            console.log("Liste bitti, döngü başa dönüyor.");
        }
    }
    startProcess();
}

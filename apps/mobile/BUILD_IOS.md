# 📱 TTS Telegram Reader - Hướng Dẫn Build & Debug iOS

> **Bundle ID:** `com.vcb.clos`
> **Project ID:** `4c910c33-85b3-4b37-b49f-55c1bcac3960`

---

## 📋 Mục Lục

1. [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
2. [Build cho iOS Simulator](#-build-cho-ios-simulator)
3. [Build cho Device thật](#-build-cho-device-thật)
4. [Chạy Development Server](#-chạy-development-server)
5. [Debug & Troubleshooting](#-debug--troubleshooting)
6. [Cấu trúc Credentials](#-cấu-trúc-credentials)

---

## 📦 Yêu Cầu Hệ Thống

| Yêu cầu | Version |
|---------|---------|
| Node.js | >= 18 |
| Expo SDK | 53 |
| EAS CLI | >= 7.0.0 |
| Xcode | 15.x hoặc 16.x (local build) |

**Cài đặt EAS CLI:**
```bash
npm install -g eas-cli
eas login
```

---

## 🖥️ Build cho iOS Simulator

### Cách 1: EAS Cloud Build (Khuyến nghị)
```bash
cd apps/mobile
eas build --profile development --platform ios
```

Sau khi build xong (~15-20 phút):
1. Tải file `.tar.gz` từ link
2. Giải nén: `tar -xzf <file>.tar.gz`
3. Drag app vào Simulator

### Cách 2: Local Build (Cần Xcode 15/16)
```bash
cd apps/mobile

# Prebuild
npx expo prebuild --platform ios --clean

# Chạy trên Simulator
npx expo run:ios
```

> ⚠️ **Lưu ý:** Xcode 26.2 (macOS mới nhất) không tương thích với một số thư viện. Dùng EAS Cloud Build nếu gặp lỗi.

---

## 📱 Build cho Device Thật

### Yêu cầu
- Apple Developer Account ($99/năm)
- Distribution Certificate (`.p12`)
- Provisioning Profile (`.mobileprovision`)

### Bước 1: Cấu hình Credentials

**File `credentials.json`:**
```json
{
  "ios": {
    "provisioningProfilePath": "./cert_key_provisions/VCB_CLOS_INHOUSE_PRODUCTION-3.mobileprovision",
    "distributionCertificate": {
      "path": "./cert_key_provisions/Private_key_enterprise_distribute.p12",
      "password": "YOUR_PASSWORD"
    }
  }
}
```

**File `eas.json`:**
```json
{
  "build": {
    "development-device": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "credentialsSource": "local"
      }
    }
  }
}
```

### Bước 2: Build
```bash
cd apps/mobile
eas build --profile development-device --platform ios
```

### Bước 3: Cài đặt lên Device
1. Tải file `.ipa` từ EAS Dashboard
2. **Cách A - Apple Configurator 2:**
   - Mở Apple Configurator 2
   - Kết nối iPhone
   - Drag `.ipa` vào device

3. **Cách B - Xcode:**
   - Mở Xcode → Window → Devices and Simulators
   - Chọn device → Drag `.ipa` vào "Installed Apps"

4. **Cách C - Diawi/TestFlight:**
   - Upload `.ipa` lên [diawi.com](https://diawi.com)
   - Quét QR code trên device

---

## 🚀 Chạy Development Server

Sau khi cài app lên device/simulator:

```bash
cd apps/mobile
npx expo start --dev-client
```

### Kết nối Device thật
1. **Cùng WiFi:** Scan QR code từ terminal
2. **USB:** Nhấn `shift + i` để chọn device qua USB
3. **Tunnel:** Nhấn `s` để switch sang tunnel mode (nếu không cùng mạng)

### Các phím tắt trong terminal
| Phím | Chức năng |
|------|-----------|
| `r` | Reload app |
| `m` | Toggle menu |
| `j` | Open debugger |
| `i` | Chọn iOS device/simulator |
| `a` | Chọn Android device |
| `s` | Switch connection mode |
| `?` | Xem tất cả commands |

---

## 🔧 Debug & Troubleshooting

### 1. Mở React DevTools
```bash
# Terminal riêng
npx react-devtools
```

### 2. Mở Chrome DevTools
1. Trong app, shake device hoặc nhấn `m` trong terminal
2. Chọn "Open JS Debugger"
3. Chrome sẽ mở với debugger

### 3. Console Logs
```bash
# Xem logs từ device
npx expo start --dev-client
# Logs hiện trực tiếp trong terminal
```

### 4. Native Logs (Xcode)
1. Mở Xcode
2. Window → Devices and Simulators
3. Chọn device → Open Console

### 5. Network Debugging
```bash
# Cài Flipper (optional)
brew install flipper
```

---

## ❌ Lỗi Thường Gặp

### Lỗi: "Invalid credentials"
```bash
# Kiểm tra credentials.json format
cat credentials.json
# Đảm bảo file .p12 và .mobileprovision tồn tại
ls -la cert_key_provisions/
```

### Lỗi: "No development client"
```bash
# Cài expo-dev-client
npx expo install expo-dev-client
# Rebuild app
eas build --profile development-device --platform ios
```

### Lỗi: "Unable to connect"
1. Kiểm tra cùng WiFi
2. Thử tunnel mode: `npx expo start --tunnel`
3. Kiểm tra firewall

### Lỗi: Local build fail (Xcode 26.2)
Dùng EAS Cloud Build thay vì local build.

---

## 📁 Cấu Trúc Credentials

```
apps/mobile/
├── credentials.json          # Config cho EAS (đã gitignore)
├── eas.json                  # Build profiles
├── cert_key_provisions/      # Folder chứa certs (đã gitignore)
│   ├── Private_key_enterprise_distribute.p12
│   ├── VCB_CLOS_INHOUSE_PRODUCTION-3.mobileprovision
│   └── cert_enterprise_distribution.cer
└── .gitignore               # Ignore sensitive files
```

---

## 🔗 Links Hữu Ích

- [EAS Build Dashboard](https://expo.dev/accounts/thanh02101991/projects/tts-telegram-reader/builds)
- [Expo Dev Client Docs](https://docs.expo.dev/development/create-development-builds/)
- [EAS Local Credentials](https://docs.expo.dev/app-signing/local-credentials/)
- [React Native Debugging](https://reactnative.dev/docs/debugging)

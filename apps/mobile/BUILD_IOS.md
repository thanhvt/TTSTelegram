# 📱 TTS Telegram Reader - Hướng Dẫn Build iOS

## 📋 Yêu Cầu

- **macOS** với Xcode đã cài đặt
- **Node.js** >= 18
- **Tài khoản Expo** (miễn phí): https://expo.dev/signup
- **Apple Developer Account** (cho production, $99/năm)

---

## 🚀 Các Bước Build

### 1. Cài đặt EAS CLI
```bash
npm install -g eas-cli
```

### 2. Đăng nhập Expo
```bash
eas login
# Nhập email và password Expo
```

### 3. Cấu hình EAS Project
```bash
cd apps/mobile
eas build:configure
```
> Lệnh này tạo file `eas.json` với các build profiles

### 4. Build Development Client

#### Option A: Cloud Build (recomm, không cần Mac)
```bash
# iOS Simulator
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

#### Option B: Local Build (cần Xcode)
```bash
# Prebuild native folders
npx expo prebuild

# Build iOS locally
npx expo run:ios
```

### 5. Cài App lên Device

Sau khi build xong:
1. Tải file `.ipa` từ Expo Dashboard
2. Dùng **Apple Configurator 2** hoặc **Xcode** để install
3. Hoặc: Dùng QR code từ Expo Dashboard

### 6. Chạy Development Server
```bash
npx expo start --dev-client
```
> Scan QR code bằng app đã cài

---

## ⚡ Quick Start (Local iOS Simulator)

Nếu anh zai có Xcode và muốn test nhanh trên Simulator:

```bash
cd apps/mobile

# Tạo native iOS folder
npx expo prebuild --platform ios

# Build và run trên Simulator
npx expo run:ios
```

---

## 📂 Files Cấu Hình Cần Thiết

### eas.json (tạo tự động hoặc thủ công)
```json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

### app.json (đã cấu hình)
- Bundle ID: `com.ttstelegram.reader`
- Background Audio: ✅ Enabled
- Track Player Plugin: ✅ Configured

---

## 🔧 Xử Lý Lỗi Thường Gặp

### Lỗi: "eas: command not found"
```bash
npm install -g eas-cli
# hoặc
yarn global add eas-cli
```

### Lỗi: "Not logged in"
```bash
eas login
```

### Lỗi: "No EAS project configured"
```bash
eas build:configure
```

### Lỗi Build iOS (CocoaPods)
```bash
cd ios
pod install
cd ..
```

---

## 📱 Test Checklist

Sau khi cài app thành công:

- [ ] App khởi động không crash
- [ ] Login screen hiển thị
- [ ] Nhập số điện thoại → Nhận OTP
- [ ] Xác thực OTP → Vào Groups screen
- [ ] Load danh sách groups từ Telegram
- [ ] Chọn groups → Bấm "Bắt đầu đọc"
- [ ] Player screen hiện và phát audio
- [ ] Background audio hoạt động (tắt màn hình)
- [ ] Lock screen controls hoạt động

---

## 🔗 Links Hữu Ích

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Development Builds](https://docs.expo.dev/development/create-development-builds/)
- [react-native-track-player Docs](https://react-native-track-player.js.org/)

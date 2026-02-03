# 📱 TTS Telegram Reader - Hướng Dẫn Build iOS

## ⚠️ LƯU Ý QUAN TRỌNG

**Xcode 26.2 (macOS mới nhất) KHÔNG tương thích** với nhiều thư viện React Native:
- `react-native-gesture-handler`
- `react-native-reanimated`
- `react-native-screens`

**Giải pháp:** Sử dụng **EAS Cloud Build** (Expo Application Services)

---

## 🚀 Build với EAS Cloud (Khuyến nghị)

### Bước 1: Đăng nhập EAS
```bash
eas login
# Nhập email và password Expo
```

### Bước 2: Build Development Client
```bash
cd apps/mobile

# iOS Simulator
eas build --profile development --platform ios

# iOS Device (cần Apple Developer Account)
eas build --profile development --platform ios --non-interactive
```

### Bước 3: Tải và cài đặt
1. Sau khi build xong (~15-20 phút), link download sẽ hiện
2. Tải file `.tar.gz` (cho Simulator) hoặc `.ipa` (cho device)
3. Cài lên Simulator: `tar -xzf file.tar.gz && open TTSTelegramReader.app`

### Bước 4: Chạy dev server
```bash
npx expo start --dev-client
```

---

## 📱 Build Local (Cần Xcode 15 hoặc 16)

Nếu bạn có Xcode 15.x hoặc 16.x:

```bash
cd apps/mobile

# Prebuild
npx expo prebuild --platform ios --clean

# Chạy iOS
npx expo run:ios
```

---

## 📂 eas.json Config

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": { "distribution": "internal" },
    "production": {}
  }
}
```

---

## ❓ FAQ

### Q: Tại sao local build fail?
A: Xcode 26.2 SDK có breaking changes với React Native native modules. EAS Cloud dùng Xcode cũ hơn (15.4 hoặc 16.x) nên stable hơn.

### Q: Mất bao lâu để build trên EAS?
A: ~15-20 phút cho build đầu tiên. Các build sau nhanh hơn (~5-10 phút).

### Q: Có cần Apple Developer Account không?
A: Không cần cho iOS Simulator. Cần cho device thật.

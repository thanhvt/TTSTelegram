# Mobile Requirements - TTS Telegram Reader

> **Version:** 1.0.0  
> **Ngày tạo:** 2026-02-02  
> **Dựa trên:** Web App hiện tại (apps/web)

---

## 1. Mục Tiêu Dự Án

Phát triển ứng dụng mobile React Native cho TTS Telegram Reader, cho phép người dùng:
- Đăng nhập tài khoản Telegram cá nhân
- Chọn và quản lý groups/channels để đọc
- Nghe tin nhắn bằng giọng nói tiếng Việt (Text-to-Speech)
- Điều khiển phát audio hands-free khi đang di chuyển

### 1.1. Tầm Nhìn Sản Phẩm

> *"Biến việc đọc tin Telegram thành trải nghiệm nghe - hoàn hảo cho lái xe, tập thể dục, hoặc khi bận tay."*

### 1.2. Giá Trị Cốt Lõi

| Giá trị | Mô tả |
|---------|-------|
| **Hands-Free** | Điều khiển bằng giọng nói/gesture, không cần nhìn màn hình |
| **Continuous Play** | Auto-play queue liên tục như podcast |
| **Sync** | Đồng bộ trạng thái đọc với Telegram |
| **Cross-Platform** | Một codebase cho cả iOS và Android |

---

## 2. Đối Tượng Người Dùng

### 2.1. Primary Users
- **Người đi xe (lái xe, đi bus):** Cần hands-free hoàn toàn
- **Người tập thể dục:** Chạy bộ, gym, không muốn cầm điện thoại
- **Người khiếm thị hoặc mắt kém:** Cần accessibility tốt

### 2.2. User Stories

```
AS A người lái xe
I WANT nghe tin nhắn từ các group quan trọng
SO THAT tôi không bỏ lỡ thông tin khi đang di chuyển

AS A người tập gym
I WANT tự động phát tin nhắn liên tục
SO THAT tôi không cần chạm vào điện thoại

AS A member của nhiều group Telegram
I WANT chọn lọc chỉ nghe một số group
SO THAT tôi tập trung vào nội dung quan trọng
```

---

## 3. Platform & Tech Stack

### 3.1. Platform Targets

| Platform | Minimum Version | Ghi chú |
|----------|-----------------|---------|
| **iOS** | iOS 14+ | iPhone 8 trở lên |
| **Android** | Android 8 (API 26)+ | Hầu hết devices 5 năm gần đây |

### 3.2. Tech Stack Đề Xuất

```
┌─────────────────────────────────────────────────────────┐
│                    MOBILE APP                           │
├─────────────────────────────────────────────────────────┤
│  React Native + Expo (Managed Workflow)                 │
│  ├── expo-av (Audio playback)                          │
│  ├── expo-secure-store (Secure storage)                │
│  ├── expo-notifications (Push notifications)           │
│  ├── @react-navigation/native (Navigation)             │
│  ├── zustand (State management - đồng bộ với web)      │
│  └── react-query (API layer + caching)                 │
└─────────────────────────────────────────────────────────┘
            │
            │  HTTP/REST API
            ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (SÃN CÓ)                     │
│                    apps/api Express                     │
│  ├── /api/auth (Telegram auth)                         │
│  ├── /api/dialogs (Groups/Channels)                    │
│  ├── /api/messages (Messages)                          │
│  └── /api/tts (Text-to-Speech)                         │
└─────────────────────────────────────────────────────────┘
```

### 3.3. Lý Do Chọn React Native + Expo

| Tiêu chí | Lý do |
|----------|-------|
| **Cross-platform** | 1 codebase cho iOS + Android |
| **Code sharing** | Chia sẻ logic với web (Zustand store, types) |
| **OTA updates** | Update app không cần qua App Store |
| **Expo ecosystem** | expo-av, expo-secure-store, expo-notifications sẵn có |
| **Team skill** | Web team React có thể chuyển đổi nhanh |

---

## 4. Phạm Vi Tính Năng

### 4.1. Must Have (MVP)

| # | Tính năng | Priority | Mô tả |
|---|-----------|----------|-------|
| F01 | Telegram Login | P0 | OTP + 2FA password |
| F02 | Session Persistence | P0 | Không cần login lại mỗi lần mở |
| F03 | Dialog List | P0 | Hiển thị groups/channels + unread count |
| F04 | Group Selection | P0 | Multi-select groups để đọc |
| F05 | Message Queue | P0 | Queue tin nhắn chưa đọc |
| F06 | Audio Player | P0 | Play/Pause/Skip với controls |
| F07 | TTS Synthesis | P0 | Gọi API synthesize + stream |
| F08 | Background Audio | P0 | Tiếp tục phát khi lock screen |
| F09 | Auto-Play | P0 | Tự động chuyển bài tiếp theo |

### 4.2. Should Have

| # | Tính năng | Priority | Mô tả |
|---|-----------|----------|-------|
| F10 | Voice Selection | P1 | Chọn giọng đọc (Google, OpenAI) |
| F11 | Playback Speed | P1 | 0.5x - 2x speed |
| F12 | Theme Selection | P1 | Dark/Light + 4 color themes |
| F13 | Mark as Read | P1 | Sync trạng thái về Telegram |
| F14 | Group Sorting | P1 | Sort by unread/time |
| F15 | Lock Screen Controls | P1 | Control từ notification |

### 4.3. Could Have (Post-MVP)

| # | Tính năng | Priority | Mô tả |
|---|-----------|----------|-------|
| F20 | Push Notifications | P2 | Thông báo tin mới |
| F21 | Voice Commands | P2 | "Hey Siri" / "OK Google" integration |
| F22 | Offline Cache | P2 | Pre-download audio khi có WiFi |
| F23 | Car Play / Android Auto | P2 | Tích hợp khi lái xe |
| F24 | Sleep Timer | P2 | Tự dừng sau N phút |
| F25 | Widget | P2 | Home screen widget quick access |

### 4.4. Won't Have (Out of Scope)

| Tính năng | Lý do |
|-----------|-------|
| Send messages | Chỉ focus đọc, không viết |
| Media playback | Không phát ảnh/video từ Telegram |
| Inline keyboard actions | Không tương tác với bots |
| Group/Channel creation | Quản lý qua Telegram app |

---

## 5. Yêu Cầu Phi Chức Năng

### 5.1. Performance

| Metric | Target | Ghi chú |
|--------|--------|---------|
| **App Launch** | < 2s | Cold start đến màn hình chính |
| **Audio Start** | < 500ms | Từ tap Play đến phát âm thanh |
| **List Scroll** | 60 FPS | Không jank khi scroll |
| **Memory** | < 150MB | Sử dụng bình thường |
| **Battery** | < 5%/hour | Khi phát audio background |

### 5.2. Security

| Requirement | Implementation |
|-------------|----------------|
| Session token storage | expo-secure-store (Keychain/Keystore) |
| API communication | HTTPS only |
| No hardcoded secrets | Environment variables |
| Biometric auth (optional) | FaceID/TouchID để mở app |

### 5.3. Accessibility (A11y)

| Requirement | Mô tả |
|-------------|-------|
| VoiceOver/TalkBack | Tất cả elements có accessibility labels |
| Dynamic Type | Hỗ trợ font size từ system |
| Touch targets | Minimum 48x48dp |
| Color contrast | WCAG AA compliance |

### 5.4. Offline Behavior

| Scenario | Behavior |
|----------|----------|
| No network | Hiển thị cached dialogs, queue đã có |
| Network lost while playing | Tiếp tục phát audio đã download |
| Network restored | Auto-refresh dialogs |

---

## 6. Dependencies & Risks

### 6.1. Dependencies

| Dependency | Impact Level | Mitigation |
|------------|--------------|------------|
| Backend API (apps/api) | Critical | Cần deploy API trước mobile |
| Telegram API limits | High | Rate limiting, queue requests |
| TTS providers | High | Fallback Google free nếu OpenAI fail |
| App Store approval | Medium | Tuân thủ guidelines |

### 6.2. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Telegram session timeout | Medium | High | Auto-refresh, re-auth flow |
| Background audio killed by OS | Medium | Medium | Background task best practices |
| TTS quota exceeded | Low | High | Caching audio, rate limiting |
| App Store rejection | Low | High | Review guidelines sớm |

---

## 7. Success Metrics

### 7.1. KPIs

| Metric | Target (3 months) |
|--------|-------------------|
| Daily Active Users | 100+ |
| Session duration | > 15 mins |
| Messages read/day/user | > 30 |
| Crash-free rate | > 99% |
| App rating | > 4.0 stars |

### 7.2. Business Goals

- Giảm thời gian đọc tin nhắn khi bận
- Tăng engagement với Telegram groups
- Build user base cho future premium features

---

## 8. Timeline Dự Kiến

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1: MVP** | 4 weeks | Core authentication + audio player |
| **Phase 2: Polish** | 2 weeks | Settings, themes, background audio |
| **Phase 3: Beta** | 2 weeks | TestFlight/Internal testing |
| **Phase 4: Launch** | 1 week | App Store/Play Store submission |

---

## 9. Tài Liệu Liên Quan

- [mobile-features.md](./mobile-features.md) - Tính năng chi tiết
- [mobile-architecture.md](./mobile-architecture.md) - Kiến trúc ứng dụng
- [mobile-ui-screens.md](./mobile-ui-screens.md) - Thiết kế màn hình
- [mobile-api-integration.md](./mobile-api-integration.md) - Tích hợp API

---

> **Next Steps:**
> 1. ✅ Review tài liệu requirements này
> 2. Phê duyệt tech stack (React Native + Expo)
> 3. Setup project structure
> 4. Bắt đầu Phase 1 MVP

# Mobile API Integration - TTS Telegram Reader

> **Tích hợp API backend cho mobile app**

---

## API Base URL

```
Development: http://localhost:3001/api
Production: https://api.tts-telegram.com/api
```

---

## 1. Authentication APIs

### POST /auth/send-code
Gửi mã OTP đến số điện thoại

**Request:**
```json
{ "phoneNumber": "+84376340112" }
```

**Response:**
```json
{ "success": true, "data": { "message": "Đã gửi mã" } }
```

---

### POST /auth/sign-in
Xác thực OTP và đăng nhập

**Request:**
```json
{
  "phoneNumber": "+84376340112",
  "code": "12345",
  "password": "2fa_password"  // Optional, chỉ khi 2FA
}
```

**Response:**
```json
{
  "success": true,
  "data": { "sessionString": "encrypted_session..." }
}
```

**Errors:**
- 400: "Tài khoản yêu cầu mật khẩu 2FA" → Show 2FA input

---

### POST /auth/restore
Khôi phục session đã lưu

**Request:**
```json
{ "sessionString": "encrypted_session..." }
```

**Response:**
```json
{ "success": true, "data": { "restored": true } }
```

---

### POST /auth/logout
Đăng xuất và xóa session

**Response:**
```json
{ "success": true, "data": { "message": "Đã đăng xuất" } }
```

---

## 2. Dialogs APIs

### GET /dialogs
Lấy danh sách groups/channels

**Response:**
```json
{
  "success": true,
  "data": {
    "dialogs": [
      {
        "id": "-1001234567890",
        "title": "Tech News Vietnam",
        "type": "channel",
        "unreadCount": 24,
        "lastMessage": "New framework...",
        "lastMessageDate": "2026-02-02T..."
      }
    ]
  }
}
```

---

## 3. Messages APIs

### GET /messages/:dialogId
Lấy tin nhắn từ dialog

**Query params:** `limit=50`

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 12345,
        "dialogId": "-1001234567890",
        "text": "Breaking news...",
        "senderName": "John Doe",
        "date": "2026-02-02T10:30:00Z",
        "isOutgoing": false
      }
    ]
  }
}
```

---

### POST /messages/:dialogId/read
Đánh dấu tin nhắn đã đọc

**Request:**
```json
{ "messageIds": [12345, 12346] }
```

---

## 4. TTS APIs

### GET /tts/voices
Lấy danh sách giọng đọc

**Response:**
```json
{
  "success": true,
  "data": {
    "voices": [
      {
        "id": "vi",
        "name": "Vietnamese",
        "gender": "Female",
        "provider": "google"
      }
    ],
    "openaiAvailable": true,
    "googleCloudAvailable": true
  }
}
```

---

### POST /tts/synthesize
Tạo audio từ text

**Request:**
```json
{
  "text": "Nội dung tin nhắn...",
  "provider": "google",
  "voice": "vi",
  "randomVoice": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "duration": 5.5,
    "voiceUsed": "vi",
    "providerUsed": "google"
  }
}
```

---

### GET /tts/stream/:id
Stream audio file (MP3)

**Headers:** `Content-Type: audio/mpeg`

---

## 5. Mobile Implementation

### API Client

```typescript
// src/services/api/client.ts
const API = 'https://api.tts-telegram.com/api';

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers }
  });
  
  if (!res.ok) throw new ApiError(res.status);
  return res.json();
}
```

### React Query Usage

```typescript
// Get dialogs
const { data } = useQuery(['dialogs'], () => 
  apiClient('/dialogs')
);

// Synthesize TTS
const { mutateAsync } = useMutation((text: string) =>
  apiClient('/tts/synthesize', {
    method: 'POST',
    body: JSON.stringify({ text, provider: 'google' })
  })
);
```

---

## 6. Error Handling

| Status | Meaning | Mobile Action |
|--------|---------|---------------|
| 401 | Session expired | Redirect to login |
| 400 | Bad request | Show error message |
| 429 | Rate limited | Wait and retry |
| 500 | Server error | Retry with backoff |

---

> **Liên quan:** [mobile-architecture.md](./mobile-architecture.md)

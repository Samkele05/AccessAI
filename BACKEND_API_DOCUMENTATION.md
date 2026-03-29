# AccessAI Backend API Documentation

Complete API documentation for the AccessAI mobile backend. All endpoints are deployed as Supabase Edge Functions and require authentication.

## Authentication

All endpoints require a valid Supabase JWT token in the Authorization header:

```
Authorization: Bearer <supabase-jwt-token>
```

Get tokens using Supabase Auth:
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
const token = data.session.access_token;
```

## Base URL

```
https://<your-project-id>.supabase.co/functions/v1
```

---

## 1. Accessibility Profile Management

**Endpoint:** `/accessibility-profile`

Manage user accessibility preferences and settings.

### Get Profile

```json
POST /accessibility-profile
{
  "action": "get"
}
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "display_name": "John",
    "accessibility_needs": ["visual", "mobility"],
    "preferred_voice": "nova",
    "reading_level": "simple",
    "interaction_mode": "both",
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  },
  "isNew": false
}
```

### Update Profile

```json
POST /accessibility-profile
{
  "action": "update",
  "profileData": {
    "displayName": "John Doe",
    "accessibilityNeeds": ["visual", "mobility"],
    "preferredVoice": "nova",
    "readingLevel": "simple",
    "interactionMode": "voice"
  }
}
```

**Profile Fields:**
- `displayName`: User's preferred name
- `accessibilityNeeds`: Array of `["visual", "hearing", "mobility", "cognitive", "employment"]`
- `preferredVoice`: `"alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"`
- `readingLevel`: `"eli5" | "simple" | "teen" | "adult"`
- `interactionMode`: `"voice" | "text" | "both"`

---

## 2. Session Management

**Endpoint:** `/session-manager`

Create and manage scanning sessions.

### Create Session

```json
POST /session-manager
{
  "action": "create",
  "sessionType": "environment",
  "locationContext": {
    "latitude": -26.2041,
    "longitude": 28.0473,
    "placeName": "Home",
    "placeType": "residence"
  }
}
```

**Session Types:** `"environment" | "document" | "object" | "navigation" | "general"`

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "user_id": "uuid",
    "session_type": "environment",
    "location_context": {...},
    "started_at": "2025-01-15T10:00:00Z",
    "total_interactions": 0
  }
}
```

### End Session

```json
POST /session-manager
{
  "action": "end",
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "session": {...},
  "summary": {
    "duration_ms": 125000,
    "scans": 5,
    "conversations": 8
  }
}
```

### Get Session

```json
POST /session-manager
{
  "action": "get",
  "sessionId": "uuid"
}
```

### List Sessions

```json
POST /session-manager
{
  "action": "list",
  "limit": 20
}
```

### Get History

```json
POST /session-manager
{
  "action": "get_history",
  "limit": 50
}
```

---

## 3. Environment Scanning

**Endpoint:** `/scan-environment`

Scan and analyze environments with AI vision.

### Scan Environment

```json
POST /scan-environment
{
  "sessionId": "uuid",
  "scanType": "photo",
  "imageData": "base64-encoded-image",
  "imageType": "image/jpeg",
  "locationContext": {
    "latitude": -26.2041,
    "longitude": 28.0473,
    "placeName": "Kitchen"
  },
  "detailLevel": "detailed",
  "requestedInfo": ["obstacles", "text", "people"]
}
```

**Scan Types:**
- `"photo"`: General image description
- `"live_stream"`: Real-time environment for navigation
- `"document"`: OCR and document analysis
- `"sign"`: Read signs and notices
- `"face"`: Describe people
- `"navigation"`: Accessibility-focused navigation

**Detail Levels:** `"quick" | "standard" | "detailed"`

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid",
  "scanId": "uuid",
  "description": "You are in a modern kitchen. On your left is a stainless steel refrigerator...",
  "fullDescription": "Detailed technical description...",
  "detectedObjects": [],
  "detectedText": [],
  "accessibilityAlerts": [
    {
      "type": "stairs",
      "severity": "high",
      "message": "Steps detected ahead"
    }
  ],
  "responseTimeMs": 1250,
  "scanType": "navigation"
}
```

---

## 4. AI Assistant (Conversational)

**Endpoint:** `/ai-assistant`

Interactive AI assistant with environment awareness.

### Send Message

```json
POST /ai-assistant
{
  "sessionId": "uuid",
  "message": "What's in front of me?",
  "contextType": "environment_query",
  "recentScanId": "uuid",
  "voiceMode": false
}
```

**Context Types:** `"environment_query" | "navigation" | "assistance" | "general" | "follow_up"`

**Response:**
```json
{
  "success": true,
  "conversationId": "uuid",
  "response": "Based on your recent scan, there's a doorway directly ahead about 2 meters away...",
  "responseTimeMs": 850,
  "contextUsed": {
    "hasEnvironmentContext": true,
    "hasConversationHistory": true
  }
}
```

---

## 5. Voice Processing

**Endpoint:** `/voice-stream`

Speech-to-text and text-to-speech.

### Transcribe Audio

```json
POST /voice-stream
{
  "action": "transcribe",
  "audioData": "base64-encoded-audio-webm",
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "transcript": "What's in front of me?",
  "action": "transcribe"
}
```

### Generate Speech

```json
POST /voice-stream
{
  "action": "speak",
  "text": "Hello, welcome to your kitchen",
  "voice": "nova",
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "audioData": "base64-encoded-mp3",
  "voice": "nova",
  "action": "speak"
}
```

**Play audio:**
```javascript
const audio = new Audio(`data:audio/mpeg;base64,${response.audioData}`);
audio.play();
```

---

## 6. Environment Learning

**Endpoint:** `/environment-learning`

Learn and remember frequently visited places.

### Get Place

```json
POST /environment-learning
{
  "action": "get_place",
  "placeName": "Home"
}
```

### Update Place

```json
POST /environment-learning
{
  "action": "update_place",
  "placeId": "uuid",
  "navigationNotes": "Turn left after entering, bathroom is 3 steps ahead"
}
```

### List Places

```json
POST /environment-learning
{
  "action": "list_places"
}
```

### Suggest Context

```json
POST /environment-learning
{
  "action": "suggest_context",
  "location": {
    "latitude": -26.2041,
    "longitude": 28.0473
  },
  "radius": 100
}
```

**Response:**
```json
{
  "success": true,
  "suggestedPlace": {
    "id": "uuid",
    "place_name": "Home",
    "visit_count": 15,
    "navigation_notes": "...",
    "common_objects": [...]
  },
  "nearbyPlaces": [...],
  "contextualAdvice": "Welcome back home! You've been here 15 times. Remember, the bathroom is on your left.",
  "isKnownLocation": true
}
```

### Delete Place

```json
POST /environment-learning
{
  "action": "delete_place",
  "placeId": "uuid"
}
```

---

## Mobile Implementation Example

### Complete Flow: Scan & Interact

```javascript
// 1. Initialize profile
const { data: profile } = await fetch(
  `${SUPABASE_URL}/functions/v1/accessibility-profile`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action: 'get' })
  }
).then(r => r.json());

// 2. Create session
const { session } = await fetch(
  `${SUPABASE_URL}/functions/v1/session-manager`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'create',
      sessionType: 'navigation',
      locationContext: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }
    })
  }
).then(r => r.json());

// 3. Capture and scan image
const imageBase64 = await captureImageAsBase64();

const scanResult = await fetch(
  `${SUPABASE_URL}/functions/v1/scan-environment`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId: session.id,
      scanType: 'navigation',
      imageData: imageBase64,
      detailLevel: 'detailed'
    })
  }
).then(r => r.json());

// 4. Speak description
const voiceResult = await fetch(
  `${SUPABASE_URL}/functions/v1/voice-stream`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'speak',
      text: scanResult.description
    })
  }
).then(r => r.json());

const audio = new Audio(`data:audio/mpeg;base64,${voiceResult.audioData}`);
await audio.play();

// 5. User asks follow-up question
const assistantResponse = await fetch(
  `${SUPABASE_URL}/functions/v1/ai-assistant`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId: session.id,
      message: "Are there any stairs?",
      contextType: 'environment_query',
      recentScanId: scanResult.scanId,
      voiceMode: true
    })
  }
).then(r => r.json());

// 6. End session
await fetch(
  `${SUPABASE_URL}/functions/v1/session-manager`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'end',
      sessionId: session.id
    })
  }
);
```

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200`: Success
- `401`: Unauthorized (missing/invalid token)
- `500`: Server error

---

## Rate Limits & Performance

- All vision operations: ~1-3 seconds response time
- Text-to-speech: ~500ms-1s response time
- Conversational AI: ~800ms-2s response time
- Database operations: <100ms response time

---

## Database Schema

Direct Supabase database access for advanced queries:

**Tables:**
- `user_profiles`: User accessibility settings
- `scan_sessions`: Scanning session records
- `environment_scans`: Individual scan results
- `ai_conversations`: Chat history
- `learned_environments`: Frequently visited places

All tables have Row Level Security (RLS) enabled and are user-isolated.

---

## Next Steps

1. Implement mobile app using React Native, Flutter, or Swift/Kotlin
2. Integrate camera for real-time scanning
3. Add GPS location tracking
4. Implement background audio for continuous assistance
5. Add offline mode with local caching
6. Build push notifications for contextual alerts

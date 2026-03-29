# Mobile Integration Guide for AccessAI

Complete guide to integrate AccessAI backend with mobile applications (iOS, Android, React Native, Flutter).

## Overview

AccessAI backend is now fully deployed and ready for mobile integration. You can scan your environment with your phone, and AI will interpret and interact with you in real-time.

## Backend Architecture

**6 Edge Functions (All Deployed & Active):**
1. `scan-environment` - Real-time vision AI for environment scanning
2. `ai-assistant` - Conversational AI with environment awareness
3. `accessibility-profile` - User settings and preferences
4. `session-manager` - Session tracking and history
5. `voice-stream` - Speech-to-text and text-to-speech
6. `environment-learning` - Learn frequently visited places

**Database (Supabase):**
- `user_profiles` - Accessibility preferences
- `scan_sessions` - Session tracking
- `environment_scans` - Scan history with AI descriptions
- `ai_conversations` - Chat history
- `learned_environments` - Frequently visited places

**All tables have RLS enabled for data security.**

---

## Quick Start Integration

### 1. Install Supabase Client

**React Native / Expo:**
```bash
npm install @supabase/supabase-js
npm install react-native-url-polyfill
npm install @react-native-async-storage/async-storage
```

**Flutter:**
```bash
flutter pub add supabase_flutter
```

**Swift (iOS):**
```swift
dependencies: [
    .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0")
]
```

**Kotlin (Android):**
```kotlin
implementation("io.github.jan-tennert.supabase:postgrest-kt:2.0.0")
implementation("io.github.jan-tennert.supabase:gotrue-kt:2.0.0")
implementation("io.github.jan-tennert.supabase:functions-kt:2.0.0")
```

### 2. Initialize Supabase

**React Native:**
```javascript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**Flutter:**
```dart
import 'package:supabase_flutter/supabase_flutter.dart';

await Supabase.initialize(
  url: 'YOUR_SUPABASE_URL',
  anonKey: 'YOUR_SUPABASE_ANON_KEY',
);

final supabase = Supabase.instance.client;
```

**Swift:**
```swift
import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: "YOUR_SUPABASE_URL")!,
    supabaseKey: "YOUR_SUPABASE_ANON_KEY"
)
```

---

## Core Mobile Workflows

### Workflow 1: Camera Scan & Voice Response

**React Native Example:**
```javascript
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

async function scanEnvironmentAndSpeak() {
  // 1. Create session
  const { data: sessionData } = await supabase.functions.invoke('session-manager', {
    body: {
      action: 'create',
      sessionType: 'navigation',
      locationContext: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }
    }
  });

  const sessionId = sessionData.session.id;

  // 2. Capture image
  const photo = await cameraRef.current.takePictureAsync({ base64: true });

  // 3. Scan with AI
  const { data: scanResult } = await supabase.functions.invoke('scan-environment', {
    body: {
      sessionId,
      scanType: 'navigation',
      imageData: photo.base64,
      detailLevel: 'detailed'
    }
  });

  // 4. Convert to speech
  const { data: voiceData } = await supabase.functions.invoke('voice-stream', {
    body: {
      action: 'speak',
      text: scanResult.description
    }
  });

  // 5. Play audio
  const soundObject = new Audio.Sound();
  const audioUri = `data:audio/mpeg;base64,${voiceData.audioData}`;
  await soundObject.loadAsync({ uri: audioUri });
  await soundObject.playAsync();
}
```

**Flutter Example:**
```dart
import 'package:camera/camera.dart';
import 'package:audioplayers/audioplayers.dart';
import 'dart:convert';

Future<void> scanEnvironmentAndSpeak() async {
  // 1. Create session
  final sessionResponse = await supabase.functions.invoke(
    'session-manager',
    body: {
      'action': 'create',
      'sessionType': 'navigation',
    },
  );

  final sessionId = sessionResponse.data['session']['id'];

  // 2. Capture image
  final XFile image = await cameraController.takePicture();
  final bytes = await image.readAsBytes();
  final base64Image = base64Encode(bytes);

  // 3. Scan with AI
  final scanResponse = await supabase.functions.invoke(
    'scan-environment',
    body: {
      'sessionId': sessionId,
      'scanType': 'navigation',
      'imageData': base64Image,
      'detailLevel': 'detailed',
    },
  );

  // 4. Convert to speech
  final voiceResponse = await supabase.functions.invoke(
    'voice-stream',
    body: {
      'action': 'speak',
      'text': scanResponse.data['description'],
    },
  );

  // 5. Play audio
  final player = AudioPlayer();
  final audioBytes = base64Decode(voiceResponse.data['audioData']);
  await player.play(BytesSource(audioBytes));
}
```

### Workflow 2: Voice Question + AI Response

**React Native:**
```javascript
import { Audio } from 'expo-av';

async function askQuestion() {
  // 1. Record audio
  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
  await recording.startAsync();

  // ... user speaks ...

  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  const base64Audio = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 2. Transcribe
  const { data: transcriptData } = await supabase.functions.invoke('voice-stream', {
    body: {
      action: 'transcribe',
      audioData: base64Audio
    }
  });

  // 3. Get AI response
  const { data: aiResponse } = await supabase.functions.invoke('ai-assistant', {
    body: {
      sessionId: currentSessionId,
      message: transcriptData.transcript,
      contextType: 'environment_query',
      voiceMode: true
    }
  });

  // 4. Speak response
  const { data: voiceData } = await supabase.functions.invoke('voice-stream', {
    body: {
      action: 'speak',
      text: aiResponse.response
    }
  });

  // 5. Play
  const sound = new Audio.Sound();
  await sound.loadAsync({ uri: `data:audio/mpeg;base64,${voiceData.audioData}` });
  await sound.playAsync();
}
```

### Workflow 3: Continuous Navigation Mode

**React Native:**
```javascript
async function startNavigationMode() {
  let sessionId;

  // Initialize
  const { data: sessionData } = await supabase.functions.invoke('session-manager', {
    body: { action: 'create', sessionType: 'navigation' }
  });
  sessionId = sessionData.session.id;

  // Continuous scan every 3 seconds
  const interval = setInterval(async () => {
    const photo = await cameraRef.current.takePictureAsync({ base64: true });

    const { data: scan } = await supabase.functions.invoke('scan-environment', {
      body: {
        sessionId,
        scanType: 'live_stream',
        imageData: photo.base64,
        detailLevel: 'quick'
      }
    });

    // Alert if hazard detected
    if (scan.accessibilityAlerts?.length > 0) {
      const alert = scan.accessibilityAlerts[0];

      const { data: voice } = await supabase.functions.invoke('voice-stream', {
        body: { action: 'speak', text: alert.message }
      });

      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: `data:audio/mpeg;base64,${voice.audioData}` });
      await sound.playAsync();
    }
  }, 3000);

  return () => {
    clearInterval(interval);
    supabase.functions.invoke('session-manager', {
      body: { action: 'end', sessionId }
    });
  };
}
```

---

## UI Components Examples

### React Native Camera Screen

```javascript
import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Camera } from 'expo-camera';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState('');
  const cameraRef = useRef(null);

  const handleScan = async () => {
    setScanning(true);

    const photo = await cameraRef.current.takePictureAsync({ base64: true });

    const { data } = await supabase.functions.invoke('scan-environment', {
      body: {
        scanType: 'photo',
        imageData: photo.base64,
        detailLevel: 'detailed'
      }
    });

    setResult(data.description);

    // Speak result
    const { data: voice } = await supabase.functions.invoke('voice-stream', {
      body: { action: 'speak', text: data.description }
    });

    const sound = new Audio.Sound();
    await sound.loadAsync({ uri: `data:audio/mpeg;base64,${voice.audioData}` });
    await sound.playAsync();

    setScanning(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} ref={cameraRef} />

      <TouchableOpacity
        onPress={handleScan}
        disabled={scanning}
        style={{
          position: 'absolute',
          bottom: 40,
          alignSelf: 'center',
          backgroundColor: '#6EE7B7',
          padding: 20,
          borderRadius: 50
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
          {scanning ? 'Scanning...' : 'Scan Environment'}
        </Text>
      </TouchableOpacity>

      {result && (
        <View style={{
          position: 'absolute',
          top: 40,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 16,
          borderRadius: 12
        }}>
          <Text style={{ color: 'white' }}>{result}</Text>
        </View>
      )}
    </View>
  );
}
```

### Flutter Camera Screen

```dart
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';

class ScanScreen extends StatefulWidget {
  @override
  _ScanScreenState createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  CameraController? _controller;
  bool _scanning = false;
  String _result = '';

  Future<void> handleScan() async {
    setState(() => _scanning = true);

    final image = await _controller!.takePicture();
    final bytes = await image.readAsBytes();
    final base64Image = base64Encode(bytes);

    final response = await supabase.functions.invoke(
      'scan-environment',
      body: {
        'scanType': 'photo',
        'imageData': base64Image,
        'detailLevel': 'detailed',
      },
    );

    setState(() {
      _result = response.data['description'];
      _scanning = false;
    });

    // Speak result
    final voiceResponse = await supabase.functions.invoke(
      'voice-stream',
      body: {
        'action': 'speak',
        'text': response.data['description'],
      },
    );

    final player = AudioPlayer();
    final audioBytes = base64Decode(voiceResponse.data['audioData']);
    await player.play(BytesSource(audioBytes));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          CameraPreview(_controller!),

          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: ElevatedButton(
                onPressed: _scanning ? null : handleScan,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF6EE7B7),
                  padding: EdgeInsets.all(20),
                  shape: CircleBorder(),
                ),
                child: Text(
                  _scanning ? 'Scanning...' : 'Scan',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),

          if (_result.isNotEmpty)
            Positioned(
              top: 40,
              left: 20,
              right: 20,
              child: Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _result,
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
```

---

## Authentication Setup

```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Sign out
await supabase.auth.signOut();
```

---

## Permissions Required

**iOS (Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>AccessAI needs camera access to scan your environment</string>
<key>NSMicrophoneUsageDescription</key>
<string>AccessAI needs microphone access for voice commands</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>AccessAI needs location to provide contextual assistance</string>
```

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

---

## Performance Optimization Tips

1. **Image Compression**: Resize images to 1024x1024 before sending
2. **Caching**: Cache recent scans locally to reduce API calls
3. **Batch Operations**: Group multiple operations in single session
4. **Voice Streaming**: Pre-load common phrases as audio files
5. **Offline Mode**: Store last 10 scans for offline access

---

## Next Steps

1. Build camera interface with real-time preview
2. Add voice command button with visual feedback
3. Implement session persistence across app restarts
4. Add push notifications for learned place arrivals
5. Build settings screen for accessibility preferences
6. Add offline mode with local database
7. Implement background location tracking

For complete API documentation, see `BACKEND_API_DOCUMENTATION.md`

# AccessAI — Access For All

An **accessibility super-app** with AI-powered tools solving five critical accessibility challenges: cognitive, visual, hearing & speech, employment, and mobility.

## 🎯 Features

### 1. **Cognitive Module** 🧠
- **Text Simplification** at multiple reading levels (ELI5, Plain English, Teen, Adult)
- Paste any complex document and get it rewritten for your comprehension level
- Uses OpenAI GPT-4 for intelligent simplification

### 2. **Visual Module** 👁️
- **Image Description & Scene Understanding**
- Upload any image (photo, document, chart, sign) and get detailed accessibility descriptions
- Three description modes: Standard, Detailed, Text-only
- Powered by OpenAI's vision capabilities

### 3. **Hearing & Speech Module** 👂
- **Speech-to-Text**: Browser-based live transcription (using Web Speech API)
- **Text-to-Speech**: Generate natural-sounding speech with 6 voice options
- Powered by OpenAI's Whisper and TTS models

### 4. **Employment Module** 💼
- **CV Feedback**: Get accessibility-focused feedback on your resume
- **Interview Prep**: Practice interviews with AI coaching tailored to your needs
- **Cover Letter Generation**: AI-written cover letters in plain, accessible English
- South Africa-focused career guidance

### 5. **Mobility Module** ♿
- **Voice Command Interpretation**: Speak natural commands and get accessible actions
- Voice-controlled navigation for users who interact without a standard mouse/keyboard
- Interprets commands into actionable UI operations (scroll, click, navigate, zoom, etc.)

## 🏗️ Architecture

### Frontend
- **React 18** with Vite for fast development
- **Beautiful dark UI** with glassmorphism and gradient accents
- Fully responsive and accessible
- Real-time speech recognition and synthesis

### Backend
- **Express.js** API server
- **OpenAI Integration** (GPT-4, Vision, Whisper, TTS)
- CORS-enabled for secure frontend communication
- Handles all AI requests server-side (keeps API keys safe)

### API Endpoints

```
POST /api/cognitive/simplify
  - Input: text, level (eli5|simple|teen|adult)
  - Output: simplified text

POST /api/visual/describe
  - Input: imageData (base64), imageType, detail (standard|detailed|text)
  - Output: description

POST /api/hearing/speak
  - Input: text, voice (alloy|echo|fable|onyx|nova|shimmer)
  - Output: audio/mpeg stream

POST /api/employment/generate
  - Input: mode (cv|interview|cover), input text, optional role
  - Output: AI-generated feedback or content

POST /api/mobility/command
  - Input: command (voice text), context
  - Output: JSON with action, target, feedback, magnitude
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- OpenAI API key

### Installation

```bash
# Clone the repo
git clone https://github.com/Samkele05/AccessAI.git
cd AccessAI

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Add your OpenAI API key to .env
```

### Development

```bash
# Start both backend API (port 3001) and frontend (port 5173)
npm run dev

# Or run separately:
npm run dev:server  # Backend only
npm run dev:client  # Frontend only
```

### Production Build

```bash
# Build frontend
npm run build

# Start production server (serves frontend + API)
npm run start
```

The production server will:
- Serve the built frontend from `/dist`
- Run the API on port 3001
- Automatically serve `index.html` for SPA routing

## 📝 Environment Variables

```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1  # Optional, defaults to OpenAI
PORT=3001  # Backend port
NODE_ENV=production  # Set to production for serving built frontend
```

## 🎨 UI/UX Highlights

- **Dark theme** with color-coded modules (green, red, blue, yellow, purple)
- **Smooth animations** and transitions
- **Accessible components** with ARIA labels and keyboard navigation
- **Responsive grid layout** that works on mobile, tablet, desktop
- **Real-time feedback** with loading states and error handling
- **Copy-to-clipboard** for all outputs
- **Voice input** support where available

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, CSS-in-JS |
| Backend | Express.js, Node.js |
| AI | OpenAI (GPT-4, Vision, Whisper, TTS) |
| Speech | Web Speech API (browser STT), OpenAI TTS |
| Build | Vite, ESBuild |
| Package Manager | npm |

## 📦 Key Dependencies

- `react` - UI framework
- `react-dom` - React rendering
- `express` - Backend server
- `cors` - Cross-origin support
- `openai` - OpenAI SDK
- `multer` - File upload handling
- `vite` - Build tool

## 🧪 Testing the APIs

```bash
# Test cognitive simplification
curl -X POST http://localhost:3001/api/cognitive/simplify \
  -H "Content-Type: application/json" \
  -d '{"text": "Complex text here", "level": "eli5"}'

# Test employment feedback
curl -X POST http://localhost:3001/api/employment/generate \
  -H "Content-Type: application/json" \
  -d '{"mode": "cv", "input": "Your CV text here"}'

# Test mobility command
curl -X POST http://localhost:3001/api/mobility/command \
  -H "Content-Type: application/json" \
  -d '{"command": "scroll down", "context": "web page"}'
```

## 🌍 Accessibility Features

- **WCAG 2.1 AA compliant** color contrasts
- **Keyboard navigation** throughout
- **ARIA labels** on all interactive elements
- **Screen reader friendly** semantic HTML
- **Voice control** for mobility-impaired users
- **Multiple input methods** (text, voice, file upload)
- **Plain language** in all AI outputs
- **Adjustable reading levels** for cognitive accessibility

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For issues, questions, or suggestions, please open a GitHub issue.

---

**Built with ❤️ for accessibility at Isazi Hackathon 2025**

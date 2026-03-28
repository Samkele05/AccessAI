import { useState, useRef, useEffect } from "react";

// ─── MODULES CONFIG ───────────────────────────────────────────────────────────

const MODULES = [
  {
    id: "cognitive",
    icon: "🧠",
    title: "Cognitive",
    subtitle: "Text simplification & reading assistant",
    accent: "#6EE7B7",
    accentDark: "#059669",
    status: "live",
    tagline: "Complex text, made simple",
    description: "Paste any complex document, article, or form. AccessAI rewrites it at your chosen reading level.",
  },
  {
    id: "visual",
    icon: "👁️",
    title: "Visual",
    subtitle: "Image description & scene understanding",
    accent: "#FCA5A5",
    accentDark: "#DC2626",
    status: "live",
    tagline: "See everything, miss nothing",
    description: "Upload any image — a document, photo, chart, or sign. AccessAI describes it in full detail.",
  },
  {
    id: "hearing",
    icon: "👂",
    title: "Hearing & Speech",
    subtitle: "Live captions & speech assistance",
    accent: "#93C5FD",
    accentDark: "#2563EB",
    status: "live",
    tagline: "Every voice deserves to be heard",
    description: "Speak naturally and watch your words appear. Or type to have AccessAI generate clear speech for you.",
  },
  {
    id: "employment",
    icon: "💼",
    title: "Employment",
    subtitle: "CV feedback & interview coaching",
    accent: "#FDE68A",
    accentDark: "#D97706",
    status: "live",
    tagline: "Equal opportunity, always",
    description: "Paste your CV for accessibility-focused feedback, or practise an interview with AI coaching.",
  },
  {
    id: "mobility",
    icon: "♿",
    title: "Mobility",
    subtitle: "Voice navigation & adaptive controls",
    accent: "#C4B5FD",
    accentDark: "#7C3AED",
    status: "live",
    tagline: "Move without limits",
    description: "Full voice-controlled navigation and adaptive controls for users who interact without a standard mouse or keyboard.",
  },
];

// ─── API HELPERS ──────────────────────────────────────────────────────────────

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const labelStyle = {
  fontSize: "11px",
  fontFamily: "'DM Mono', monospace",
  letterSpacing: "2px",
  color: "#64748b",
  marginBottom: "10px",
  textTransform: "uppercase",
};

function chipStyle(active, accent) {
  return {
    padding: "7px 14px",
    borderRadius: "8px",
    border: active ? `1.5px solid ${accent}` : "1.5px solid rgba(255,255,255,0.1)",
    background: active ? `${accent}18` : "rgba(255,255,255,0.04)",
    color: active ? accent : "#94a3b8",
    fontSize: "12px",
    fontFamily: "'DM Mono', monospace",
    cursor: "pointer",
    transition: "all 0.2s",
  };
}

function textareaStyle() {
  return {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "14px 16px",
    color: "#e2e8f0",
    fontSize: "14px",
    fontFamily: "'Lora', serif",
    lineHeight: 1.7,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };
}

function primaryButtonStyle(disabled, accent, textColor) {
  return {
    padding: "14px 24px",
    borderRadius: "12px",
    border: "none",
    background: disabled ? `${accent}25` : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
    color: disabled ? "#64748b" : textColor,
    fontSize: "14px",
    fontWeight: 700,
    fontFamily: "'DM Mono', monospace",
    letterSpacing: "1px",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.25s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  };
}

function copyButtonStyle(accent) {
  return {
    background: "transparent",
    border: `1px solid ${accent}40`,
    color: accent,
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "11px",
    fontFamily: "'DM Mono', monospace",
    cursor: "pointer",
  };
}

function outputBoxStyle(accent) {
  return {
    background: `${accent}06`,
    border: `1.5px solid ${accent}25`,
    borderRadius: "12px",
    padding: "16px",
    color: "#e2e8f0",
    fontSize: "14px",
    fontFamily: "'Lora', serif",
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
  };
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function Spinner() {
  return <span style={{ display: "inline-block", animation: "spin 1s linear infinite", marginRight: "6px" }}>⟳</span>;
}

function ErrorBox({ message }) {
  return (
    <div style={{
      color: "#FCA5A5",
      fontSize: "13px",
      padding: "12px 16px",
      background: "rgba(252,165,165,0.08)",
      borderRadius: "10px",
      border: "1px solid rgba(252,165,165,0.2)",
      fontFamily: "'DM Mono', monospace",
    }}>
      ⚠ {message}
    </div>
  );
}

// ─── COGNITIVE MODULE ─────────────────────────────────────────────────────────

const READING_LEVELS = [
  { id: "eli5", label: "ELI5", desc: "Explain like I'm 5" },
  { id: "simple", label: "Plain English", desc: "Clear & direct" },
  { id: "teen", label: "Teen", desc: "Grade 8–10 level" },
  { id: "adult", label: "Adult", desc: "Standard readability" },
];

function CognitiveModule() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [level, setLevel] = useState("simple");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const accent = "#6EE7B7";

  async function simplify() {
    if (!inputText.trim()) return;
    setLoading(true); setError(""); setOutputText("");
    try {
      const data = await apiPost("/api/cognitive/simplify", { text: inputText, level });
      setOutputText(data.simplified);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <div style={labelStyle}>Reading level</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {READING_LEVELS.map((l) => (
            <button key={l.id} onClick={() => setLevel(l.id)} style={chipStyle(level === l.id, accent)}>
              {l.label}
              <span style={{ display: "block", fontSize: "10px", opacity: 0.7, marginTop: "2px" }}>{l.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={labelStyle}>Paste your text</div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste any document, article, form, or message here…"
          rows={6}
          style={textareaStyle()}
          onFocus={(e) => (e.target.style.borderColor = `${accent}60`)}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
      </div>

      <button onClick={simplify} disabled={loading || !inputText.trim()} style={primaryButtonStyle(loading || !inputText.trim(), accent, "#0f172a")}>
        {loading ? <><Spinner />Simplifying…</> : "✦ Simplify Text"}
      </button>

      {error && <ErrorBox message={error} />}

      {outputText && (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ ...labelStyle, color: accent }}>✓ Simplified output</div>
            <button onClick={copyOutput} style={copyButtonStyle(accent)}>{copied ? "Copied!" : "Copy"}</button>
          </div>
          <div style={outputBoxStyle(accent)}>{outputText}</div>
        </div>
      )}
    </div>
  );
}

// ─── VISUAL MODULE ────────────────────────────────────────────────────────────

function VisualModule() {
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [imageType, setImageType] = useState("image/jpeg");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState("standard");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef();
  const accent = "#FCA5A5";

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(URL.createObjectURL(file));
    setImageType(file.type);
    setDescription(""); setError("");
    const reader = new FileReader();
    reader.onload = (e) => setImageData(e.target.result.split(",")[1]);
    reader.readAsDataURL(file);
  }

  async function describe() {
    if (!imageData) return;
    setLoading(true); setError(""); setDescription("");
    try {
      const data = await apiPost("/api/visual/describe", { imageData, imageType, detail });
      setDescription(data.description);
    } catch (e) {
      setError(e.message || "Couldn't describe image. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyDesc() {
    await navigator.clipboard.writeText(description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[["standard", "Standard"], ["detailed", "Detailed"], ["text", "Text Only"]].map(([id, label]) => (
          <button key={id} onClick={() => setDetail(id)} style={chipStyle(detail === id, accent)}>{label}</button>
        ))}
      </div>

      <div
        onClick={() => fileRef.current.click()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: `2px dashed ${image ? accent + "40" : "rgba(252,165,165,0.25)"}`,
          borderRadius: "14px", padding: "32px 20px", textAlign: "center", cursor: "pointer",
          background: "rgba(252,165,165,0.04)", transition: "all 0.2s",
          minHeight: "120px", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {image ? (
          <img src={image} alt="Uploaded" style={{ maxWidth: "100%", maxHeight: "220px", borderRadius: "10px", objectFit: "contain" }} />
        ) : (
          <div>
            <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>📷</div>
            <div style={{ color: "#94a3b8", fontSize: "13px", fontFamily: "'DM Mono', monospace" }}>Drop an image or click to upload</div>
            <div style={{ color: "#475569", fontSize: "11px", marginTop: "6px", fontFamily: "'DM Mono', monospace" }}>JPEG, PNG, GIF, WebP supported</div>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />

      {image && (
        <button onClick={() => { setImage(null); setImageData(null); setDescription(""); }} style={{ ...copyButtonStyle(accent), alignSelf: "flex-start" }}>
          ✕ Remove image
        </button>
      )}

      <button onClick={describe} disabled={loading || !imageData} style={primaryButtonStyle(loading || !imageData, accent, "#fff")}>
        {loading ? <><Spinner />Describing…</> : "✦ Describe Image"}
      </button>

      {error && <ErrorBox message={error} />}

      {description && (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ ...labelStyle, color: accent }}>✓ Image description</div>
            <button onClick={copyDesc} style={copyButtonStyle(accent)}>{copied ? "Copied!" : "Copy"}</button>
          </div>
          <div style={outputBoxStyle(accent)}>{description}</div>
        </div>
      )}
    </div>
  );
}

// ─── HEARING & SPEECH MODULE ──────────────────────────────────────────────────

const TTS_VOICES = [
  { id: "alloy", label: "Alloy", desc: "Neutral" },
  { id: "echo", label: "Echo", desc: "Male" },
  { id: "fable", label: "Fable", desc: "British" },
  { id: "onyx", label: "Onyx", desc: "Deep" },
  { id: "nova", label: "Nova", desc: "Female" },
  { id: "shimmer", label: "Shimmer", desc: "Soft" },
];

function HearingModule() {
  const [mode, setMode] = useState("speech-to-text");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [textToSpeak, setTextToSpeak] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voice, setVoice] = useState("nova");
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [browserSTT] = useState(() => "SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const accent = "#93C5FD";

  function startBrowserSTT() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-ZA";
    recognition.onresult = (e) => {
      let final = ""; let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setTranscript(final);
      setInterimTranscript(interim);
    };
    recognition.onend = () => { setListening(false); setInterimTranscript(""); };
    recognition.onerror = (e) => { setError(`Recognition error: ${e.error}`); setListening(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setTranscript(""); setInterimTranscript("");
  }

  function stopBrowserSTT() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  async function generateSpeech() {
    if (!textToSpeak.trim()) return;
    setSpeaking(true); setError(""); setAudioUrl(null);
    try {
      const res = await fetch("/api/hearing/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak, voice }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "TTS failed"); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setTimeout(() => audioRef.current?.play(), 100);
    } catch (e) {
      setError(e.message || "Failed to generate speech.");
    } finally {
      setSpeaking(false);
    }
  }

  async function copyTranscript() {
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        {[["speech-to-text", "🎙 Speech → Text"], ["text-to-speech", "🔊 Text → Speech"]].map(([id, label]) => (
          <button key={id} onClick={() => { setMode(id); setError(""); }} style={chipStyle(mode === id, accent)}>{label}</button>
        ))}
      </div>

      {mode === "speech-to-text" ? (
        <>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <button
              onClick={listening ? stopBrowserSTT : startBrowserSTT}
              style={{
                width: "88px", height: "88px", borderRadius: "50%",
                border: listening ? "3px solid #FCA5A5" : `3px solid ${accent}`,
                background: listening ? "rgba(252,165,165,0.15)" : "rgba(147,197,253,0.12)",
                fontSize: "2.2rem", cursor: "pointer", transition: "all 0.3s",
                animation: listening ? "pulse-ring 1.5s ease infinite" : "none",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}
              aria-label={listening ? "Stop recording" : "Start recording"}
            >
              {listening ? "⏹" : "🎙"}
            </button>
          </div>
          <div style={{ textAlign: "center", fontSize: "12px", fontFamily: "'DM Mono', monospace", color: listening ? accent : "#64748b" }}>
            {listening ? "Listening… click to stop" : "Click to start recording"}
          </div>

          {(transcript || interimTranscript) && (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ ...labelStyle, color: accent }}>Transcript</div>
                {transcript && <button onClick={copyTranscript} style={copyButtonStyle(accent)}>{copied ? "Copied!" : "Copy"}</button>}
              </div>
              <div style={{ ...outputBoxStyle(accent), minHeight: "80px" }}>
                <span>{transcript}</span>
                {interimTranscript && <span style={{ color: "#64748b", fontStyle: "italic" }}>{interimTranscript}</span>}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div>
            <div style={labelStyle}>Voice</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {TTS_VOICES.map((v) => (
                <button key={v.id} onClick={() => setVoice(v.id)} style={chipStyle(voice === v.id, accent)}>
                  {v.label}
                  <span style={{ display: "block", fontSize: "10px", opacity: 0.7, marginTop: "2px" }}>{v.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={textToSpeak}
            onChange={(e) => setTextToSpeak(e.target.value)}
            placeholder="Type what you want to say…"
            rows={5}
            style={textareaStyle()}
            onFocus={(e) => (e.target.style.borderColor = `${accent}60`)}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />

          <button onClick={generateSpeech} disabled={speaking || !textToSpeak.trim()} style={primaryButtonStyle(speaking || !textToSpeak.trim(), accent, "#fff")}>
            {speaking ? <><Spinner />Generating…</> : "🔊 Generate Speech"}
          </button>

          {audioUrl && (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <div style={{ ...labelStyle, color: accent, marginBottom: "10px" }}>✓ Audio ready</div>
              <audio ref={audioRef} controls src={audioUrl} style={{ width: "100%", borderRadius: "10px", outline: "none" }} />
            </div>
          )}
        </>
      )}

      {error && <ErrorBox message={error} />}
    </div>
  );
}

// ─── EMPLOYMENT MODULE ────────────────────────────────────────────────────────

const EMPLOYMENT_MODES = [
  { id: "cv", label: "CV Feedback" },
  { id: "interview", label: "Interview Prep" },
  { id: "cover", label: "Cover Letter" },
];

function EmploymentModule() {
  const [mode, setMode] = useState("cv");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  const [copied, setCopied] = useState(false);
  const accent = "#FDE68A";

  const placeholders = {
    cv: "Paste your CV here…",
    interview: "Paste a job description or interview question here…",
    cover: "Paste the job description here (we'll write the cover letter)…",
  };

  async function generate() {
    if (!input.trim()) return;
    setLoading(true); setError(""); setOutput("");
    try {
      const data = await apiPost("/api/employment/generate", { mode, input, role });
      setOutput(data.output);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {EMPLOYMENT_MODES.map(({ id, label }) => (
          <button key={id} onClick={() => { setMode(id); setOutput(""); setError(""); }} style={chipStyle(mode === id, accent)}>{label}</button>
        ))}
      </div>

      {mode === "interview" && (
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Target job title (optional)…"
          style={{
            background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.1)",
            borderRadius: "10px", padding: "10px 14px", color: "#e2e8f0",
            fontSize: "13px", fontFamily: "'Lora', serif", outline: "none", boxSizing: "border-box", width: "100%",
          }}
          onFocus={(e) => (e.target.style.borderColor = `${accent}60`)}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
      )}

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholders[mode]}
        rows={6}
        style={textareaStyle()}
        onFocus={(e) => (e.target.style.borderColor = `${accent}60`)}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />

      <button onClick={generate} disabled={loading || !input.trim()} style={primaryButtonStyle(loading || !input.trim(), accent, "#0f172a")}>
        {loading ? <><Spinner />Generating…</> : "✦ Generate"}
      </button>

      {error && <ErrorBox message={error} />}

      {output && (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ ...labelStyle, color: accent }}>✓ Result</div>
            <button onClick={copyOutput} style={copyButtonStyle(accent)}>{copied ? "Copied!" : "Copy"}</button>
          </div>
          <div style={outputBoxStyle(accent)}>{output}</div>
        </div>
      )}
    </div>
  );
}

// ─── MOBILITY MODULE ──────────────────────────────────────────────────────────

const DEMO_COMMANDS = [
  "Scroll down slowly",
  "Click the search button",
  "Go back to previous page",
  "Zoom in",
  "Read the page aloud",
  "Focus on the next link",
  "Navigate to the top",
];

const ACTION_ICONS = {
  scroll_up: "⬆️", scroll_down: "⬇️", click: "👆", navigate: "🧭",
  zoom_in: "🔍", zoom_out: "🔎", read_page: "📖", go_back: "⬅️",
  go_forward: "➡️", focus_next: "⏭", focus_prev: "⏮", custom: "⚡",
};

function MobilityModule() {
  const [command, setCommand] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [listening, setListening] = useState(false);
  const [browserSTT] = useState(() => "SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const recognitionRef = useRef(null);
  const accent = "#C4B5FD";

  async function executeCommand(cmd) {
    const c = cmd || command;
    if (!c.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await apiPost("/api/mobility/command", { command: c, context: "accessibility web app" });
      setResult(data);
      setHistory((prev) => [{ command: c, result: data, ts: Date.now() }, ...prev.slice(0, 9)]);
      setCommand("");
      if (data.feedback && "speechSynthesis" in window) {
        const utt = new SpeechSynthesisUtterance(data.feedback);
        utt.rate = 1.1;
        window.speechSynthesis.speak(utt);
      }
    } catch (e) {
      setError(e.message || "Failed to process command.");
    } finally {
      setLoading(false);
    }
  }

  function startVoiceCommand() {
    if (!browserSTT) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "en-ZA";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const spoken = e.results[0][0].transcript;
      setCommand(spoken);
      executeCommand(spoken);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{
        background: `${accent}08`, border: `1px solid ${accent}20`,
        borderRadius: "12px", padding: "14px 16px",
        fontSize: "13px", color: "#94a3b8", fontFamily: "'DM Mono', monospace", lineHeight: 1.6,
      }}>
        🎯 Voice navigation demo — type or speak a navigation command and AccessAI will interpret it into an accessible action.
      </div>

      <div>
        <div style={labelStyle}>Quick commands</div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {DEMO_COMMANDS.map((cmd) => (
            <button
              key={cmd}
              onClick={() => executeCommand(cmd)}
              style={{
                padding: "5px 12px", borderRadius: "20px",
                border: `1px solid ${accent}30`, background: `${accent}08`,
                color: accent, fontSize: "11px", fontFamily: "'DM Mono', monospace", cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.target.style.background = `${accent}18`; e.target.style.borderColor = `${accent}50`; }}
              onMouseLeave={(e) => { e.target.style.background = `${accent}08`; e.target.style.borderColor = `${accent}30`; }}
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && executeCommand()}
          placeholder="Type a voice command… (e.g. 'scroll down')"
          style={{
            flex: 1, background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.1)",
            borderRadius: "10px", padding: "12px 14px", color: "#e2e8f0",
            fontSize: "14px", fontFamily: "'Lora', serif", outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = `${accent}60`)}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
        {browserSTT && (
          <button
            onClick={startVoiceCommand}
            disabled={listening || loading}
            style={{
              width: "48px", height: "48px", borderRadius: "10px",
              border: `1.5px solid ${listening ? "#FCA5A5" : accent + "40"}`,
              background: listening ? "rgba(252,165,165,0.15)" : `${accent}10`,
              fontSize: "1.3rem", cursor: "pointer", flexShrink: 0,
              animation: listening ? "pulse-ring 1.5s ease infinite" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            aria-label="Speak command"
          >
            🎙
          </button>
        )}
      </div>

      <button onClick={() => executeCommand()} disabled={loading || !command.trim()} style={primaryButtonStyle(loading || !command.trim(), accent, "#fff")}>
        {loading ? <><Spinner />Processing…</> : "⚡ Execute Command"}
      </button>

      {error && <ErrorBox message={error} />}

      {result && (
        <div style={{ animation: "fadeUp 0.4s ease", background: `${accent}08`, border: `1.5px solid ${accent}25`, borderRadius: "14px", padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <span style={{ fontSize: "1.8rem" }}>{ACTION_ICONS[result.action] || "⚡"}</span>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: accent, letterSpacing: "1px", textTransform: "uppercase" }}>
                {result.action?.replace(/_/g, " ")}{result.magnitude ? ` · ${result.magnitude}` : ""}
              </div>
              {result.target && <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "3px" }}>Target: {result.target}</div>}
            </div>
          </div>
          <div style={{ fontFamily: "'Lora', serif", fontSize: "14px", color: "#e2e8f0", fontStyle: "italic" }}>
            "{result.feedback}"
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <div style={labelStyle}>Command history</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {history.map((h) => (
              <div key={h.ts} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "8px 12px", borderRadius: "8px",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                fontSize: "12px", fontFamily: "'DM Mono', monospace", color: "#64748b",
              }}>
                <span>{ACTION_ICONS[h.result.action] || "⚡"}</span>
                <span style={{ flex: 1, color: "#94a3b8" }}>{h.command}</span>
                <span style={{ color: accent, fontSize: "10px" }}>{h.result.action?.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODULE CONTENT ROUTER ────────────────────────────────────────────────────

function ModuleContent({ module }) {
  if (module.id === "cognitive") return <CognitiveModule />;
  if (module.id === "visual") return <VisualModule />;
  if (module.id === "hearing") return <HearingModule />;
  if (module.id === "employment") return <EmploymentModule />;
  if (module.id === "mobility") return <MobilityModule />;
  return <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", fontFamily: "'DM Mono', monospace" }}>🚧 Coming soon</div>;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function AccessAI() {
  const [activeModule, setActiveModule] = useState(null);

  useEffect(() => {
    function handleKey(e) { if (e.key === "Escape") setActiveModule(null); }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = activeModule ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activeModule]);

  return (
    <div style={{ minHeight: "100vh", background: "#080d14", fontFamily: "'Lora', Georgia, serif", color: "#e2e8f0", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(110,231,183,0.25); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0%, 100% { box-shadow: 0 0 0 0 rgba(147,197,253,0.4); } 50% { box-shadow: 0 0 0 14px rgba(147,197,253,0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .module-card { cursor: pointer; border-radius: 20px; padding: 28px 24px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03); backdrop-filter: blur(10px); transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; position: relative; overflow: hidden; }
        .module-card:hover { transform: translateY(-5px) scale(1.01); border-color: rgba(255,255,255,0.15); }
        .module-card.card-0 { animation: fadeUp 0.5s ease 0.05s both; }
        .module-card.card-1 { animation: fadeUp 0.5s ease 0.12s both; }
        .module-card.card-2 { animation: fadeUp 0.5s ease 0.19s both; }
        .module-card.card-3 { animation: fadeUp 0.5s ease 0.26s both; }
        .module-card.card-4 { animation: fadeUp 0.5s ease 0.33s both; }
        .module-card .hover-glow { position: absolute; inset: 0; opacity: 0; transition: opacity 0.3s; border-radius: 20px; pointer-events: none; }
        .module-card:hover .hover-glow { opacity: 1; }
        .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); z-index: 50; animation: fadeIn 0.2s ease; }
        .drawer { position: fixed; bottom: 0; left: 0; right: 0; max-height: 90vh; border-radius: 24px 24px 0 0; z-index: 51; overflow-y: auto; animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1); scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
        .drawer::-webkit-scrollbar { width: 4px; }
        .drawer::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .live-badge { display: inline-flex; align-items: center; gap: 5px; font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; padding: 3px 9px; border-radius: 20px; }
        .live-dot { width: 6px; height: 6px; border-radius: 50%; animation: blink 1.4s ease infinite; }
        .hero-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(3.5rem, 10vw, 6.5rem); line-height: 0.95; letter-spacing: 2px; color: #fff; }
        .hero-accent { background: linear-gradient(90deg, #6EE7B7, #93C5FD, #FDE68A, #FCA5A5, #C4B5FD); background-size: 300% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 4s linear infinite; }
        .noise-overlay { position: fixed; inset: 0; opacity: 0.025; pointer-events: none; z-index: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); background-size: 200px 200px; }
        .grid-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px); background-size: 40px 40px; }
      `}</style>

      <div className="noise-overlay" />
      <div className="grid-bg" />

      {/* ── HEADER ── */}
      <div style={{ position: "relative", zIndex: 1, padding: "48px 28px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "52px" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "3px", color: "#475569", textTransform: "uppercase" }}>
            AccessAI · v1
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "1px", color: "#334155", padding: "5px 12px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px" }}>
            Isazi Hackathon 2025
          </div>
        </div>

        <div style={{ maxWidth: "700px", marginBottom: "60px" }}>
          <h1 className="hero-title">ACCESS<br /><span className="hero-accent">FOR ALL</span></h1>
          <p style={{ marginTop: "24px", fontFamily: "'Lora', serif", fontSize: "16px", color: "#64748b", lineHeight: 1.75, maxWidth: "480px", fontStyle: "italic" }}>
            One platform. Five accessibility challenges. Real AI-powered tools for employment, vision, hearing, cognition, and mobility.
          </p>
          <div style={{ display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap" }}>
            {[
              { color: "#6EE7B7", label: "Cognitive" },
              { color: "#FCA5A5", label: "Visual" },
              { color: "#93C5FD", label: "Hearing" },
              { color: "#FDE68A", label: "Employment" },
              { color: "#C4B5FD", label: "Mobility" },
            ].map(({ color, label }) => (
              <div key={label} className="live-badge" style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
                <div className="live-dot" style={{ background: color }} />
                {label} — Live
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MODULE GRID ── */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 28px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
        {MODULES.map((mod, i) => (
          <div
            key={mod.id}
            className={`module-card card-${i}`}
            onClick={() => setActiveModule(mod)}
            role="button"
            tabIndex={0}
            aria-label={`Open ${mod.title} module`}
            onKeyDown={(e) => e.key === "Enter" && setActiveModule(mod)}
          >
            <div className="hover-glow" style={{ background: `radial-gradient(ellipse at top left, ${mod.accent}18, transparent 65%)` }} />
            <div style={{ position: "absolute", top: 0, left: "24px", right: "24px", height: "1px", background: `linear-gradient(90deg, transparent, ${mod.accent}60, transparent)` }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <span style={{ fontSize: "2rem" }}>{mod.icon}</span>
              <div className="live-badge" style={{ background: `${mod.accent}15`, border: `1px solid ${mod.accent}40`, color: mod.accent }}>
                <div className="live-dot" style={{ background: mod.accent }} />
                Live
              </div>
            </div>

            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.55rem", letterSpacing: "1px", color: "#f1f5f9", marginBottom: "4px" }}>{mod.title}</div>
            <div style={{ fontSize: "12px", color: "#64748b", fontFamily: "'DM Mono', monospace", lineHeight: 1.5, marginBottom: "16px" }}>{mod.subtitle}</div>
            <div style={{ fontFamily: "'Lora', serif", fontSize: "12px", fontStyle: "italic", color: mod.accent, opacity: 0.85 }}>"{mod.tagline}"</div>

            <div style={{ marginTop: "20px", padding: "8px 14px", borderRadius: "8px", background: `${mod.accent}10`, border: `1px solid ${mod.accent}25`, fontSize: "11px", fontFamily: "'DM Mono', monospace", color: mod.accent, textAlign: "center", letterSpacing: "1px" }}>
              Open module →
            </div>
          </div>
        ))}
      </div>

      {/* ── DRAWER ── */}
      {activeModule && (
        <>
          <div className="drawer-overlay" onClick={() => setActiveModule(null)} />
          <div className="drawer" style={{ background: "#0d1520", border: `1px solid ${activeModule.accent}20`, borderBottom: "none" }} role="dialog" aria-modal="true" aria-label={`${activeModule.title} module`}>
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
              <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.1)" }} />
            </div>

            <div style={{ padding: "20px 28px 24px", borderBottom: `1px solid ${activeModule.accent}15`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{ fontSize: "1.8rem" }}>{activeModule.icon}</span>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", letterSpacing: "1px", color: activeModule.accent, lineHeight: 1 }}>{activeModule.title}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#475569", marginTop: "4px" }}>{activeModule.description}</div>
                </div>
              </div>
              <button
                onClick={() => setActiveModule(null)}
                aria-label="Close module"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: "50%", width: "34px", height: "34px", cursor: "pointer", fontSize: "14px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "24px 28px 48px" }}>
              <ModuleContent module={activeModule} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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
    <div style={{ color: "#FCA5A5", fontSize: "13px", padding: "12px", background: "rgba(252,165,165,0.08)", borderRadius: "10px", border: "1px solid rgba(252,165,165,0.2)" }}>
      ⚠ {message}
    </div>
  );
}

// ─── COGNITIVE MODULE ─────────────────────────────────────────────────────────

const READING_LEVELS = [
  { id: "eli5",   label: "ELI5",          desc: "Explain like I'm 5" },
  { id: "simple", label: "Plain English",  desc: "Clear & direct" },
  { id: "teen",   label: "Teen",           desc: "Grade 8–10 level" },
  { id: "adult",  label: "Adult",          desc: "Standard readability" },
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
      setError(e.message);
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
            <button key={l.id} onClick={() => setLevel(l.id)} style={chipStyle(level === l.id, accent)}>{l.label}</button>
          ))}
        </div>
      </div>

      <div>
        <div style={labelStyle}>Text to simplify</div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste complex text here..."
          rows={6}
          style={textareaStyle()}
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
      setError(e.message);
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

// ─── HEARING MODULE ───────────────────────────────────────────────────────────

function HearingModule() {
  const [mode, setMode] = useState("stt");
  const [transcript, setTranscript] = useState("");
  const [textToSpeak, setTextToSpeak] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const recognitionRef = useRef(null);
  const accent = "#93C5FD";

  // Browser STT
  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return setError("Speech recognition not supported in this browser.");
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (e) => {
        let full = "";
        for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript;
        setTranscript(full);
      };
      recognition.onend = () => setListening(false);
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    }
  }

  // Backend TTS
  async function generateSpeech() {
    if (!textToSpeak.trim()) return;
    setLoading(true); setError(""); setAudioUrl(null);
    try {
      const res = await fetch("/api/hearing/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak }),
      });
      if (!res.ok) throw new Error("Failed to generate speech");
      const blob = await res.blob();
      setAudioUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        {[["stt", "🎙 Speech → Text"], ["tts", "🔊 Text → Speech"]].map(([id, label]) => (
          <button key={id} onClick={() => setMode(id)} style={chipStyle(mode === id, accent)}>{label}</button>
        ))}
      </div>

      {mode === "stt" ? (
        <>
          <div style={labelStyle}>Live transcription</div>
          <div style={{ ...outputBoxStyle(accent), minHeight: "100px", position: "relative" }}>
            {transcript || <span style={{ color: "#475569" }}>Transcript will appear here...</span>}
            {listening && <div style={{ position: "absolute", top: "12px", right: "12px", width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }} />}
          </div>
          <button onClick={toggleListening} style={primaryButtonStyle(false, listening ? "#ef4444" : accent, "#fff")}>
            {listening ? "Stop Listening" : "Start Listening"}
          </button>
        </>
      ) : (
        <>
          <div style={labelStyle}>Text to speak</div>
          <textarea
            value={textToSpeak}
            onChange={(e) => setTextToSpeak(e.target.value)}
            placeholder="Type something to hear it..."
            rows={4}
            style={textareaStyle()}
          />
          <button onClick={generateSpeech} disabled={loading || !textToSpeak.trim()} style={primaryButtonStyle(loading || !textToSpeak.trim(), accent, "#fff")}>
            {loading ? <><Spinner />Generating…</> : "🔊 Generate Speech"}
          </button>
          {audioUrl && (
            <div style={{ animation: "fadeUp 0.4s ease" }}>
              <div style={labelStyle}>Audio ready</div>
              <audio src={audioUrl} controls autoPlay style={{ width: "100%" }} />
            </div>
          )}
        </>
      )}
      {error && <ErrorBox message={error} />}
    </div>
  );
}

// ─── EMPLOYMENT MODULE ────────────────────────────────────────────────────────

function EmploymentModule() {
  const [mode, setMode] = useState("cv");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const accent = "#FDE68A";

  async function generate() {
    if (!input.trim()) return;
    setLoading(true); setError(""); setOutput("");
    try {
      const data = await apiPost("/api/employment/generate", { mode, input });
      setOutput(data.output);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const placeholders = {
    cv: "Paste your CV text here for feedback...",
    interview: "Paste a job description or interview question...",
    cover: "Paste the job description to write a cover letter for...",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[["cv", "CV Feedback"], ["interview", "Interview Prep"], ["cover", "Cover Letter"]].map(([id, label]) => (
          <button key={id} onClick={() => setMode(id)} style={chipStyle(mode === id, accent)}>{label}</button>
        ))}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholders[mode]}
        rows={8}
        style={textareaStyle()}
      />

      <button onClick={generate} disabled={loading || !input.trim()} style={primaryButtonStyle(loading || !input.trim(), accent, "#0f172a")}>
        {loading ? <><Spinner />Analyzing…</> : "✦ Generate Assistance"}
      </button>

      {error && <ErrorBox message={error} />}

      {output && (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <div style={{ ...labelStyle, color: accent }}>✓ AI Feedback & Suggestions</div>
          <div style={{ ...outputBoxStyle(accent), whiteSpace: "pre-wrap" }}>{output}</div>
        </div>
      )}
    </div>
  );
}

// ─── MOBILITY MODULE ──────────────────────────────────────────────────────────

function MobilityModule() {
  const [command, setCommand] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const accent = "#C4B5FD";

  async function execute() {
    if (!command.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const data = await apiPost("/api/mobility/command", { command });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={labelStyle}>Voice or text command</div>
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="e.g., 'scroll down', 'click the login button'"
          style={{ ...textareaStyle(), height: "48px", padding: "0 16px" }}
          onKeyDown={(e) => e.key === "Enter" && execute()}
        />
      </div>

      <button onClick={execute} disabled={loading || !command.trim()} style={primaryButtonStyle(loading || !command.trim(), accent, "#0f172a")}>
        {loading ? <><Spinner />Interpreting…</> : "⚡ Execute Command"}
      </button>

      {error && <ErrorBox message={error} />}

      {result && (
        <div style={{ animation: "fadeUp 0.4s ease", background: `${accent}10`, border: `1.5px solid ${accent}30`, borderRadius: "12px", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "1.2rem" }}>⚡</span>
            <div style={{ ...labelStyle, color: accent, marginBottom: 0 }}>{result.action?.replace("_", " ")}</div>
          </div>
          <div style={{ fontSize: "14px", color: "#e2e8f0", fontStyle: "italic" }}>"{result.feedback}"</div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeModule, setActiveModule] = useState("cognitive");

  const module = MODULES.find((m) => m.id === activeModule);

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f8fafc", fontFamily: "'Inter', sans-serif", padding: "20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;600;700&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        body { margin: 0; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", padding: "20px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #6EE7B7, #3B82F6)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "bold" }}>A</div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}>AccessAI</h1>
          </div>
          <div style={{ fontSize: "12px", fontFamily: "'DM Mono', monospace", color: "#64748b" }}>v1.0.0 · South Africa</div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "40px" }}>
          {/* Sidebar */}
          <aside>
            <div style={labelStyle}>Modules</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {MODULES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveModule(m.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "12px", border: "none",
                    background: activeModule === m.id ? "rgba(255,255,255,0.05)" : "transparent",
                    color: activeModule === m.id ? m.accent : "#94a3b8",
                    cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{m.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px" }}>{m.title}</div>
                    <div style={{ fontSize: "11px", opacity: 0.7 }}>{m.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "24px", padding: "32px" }}>
            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <span style={{ fontSize: "32px" }}>{module.icon}</span>
                <h2 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>{module.title}</h2>
              </div>
              <p style={{ color: "#94a3b8", fontSize: "16px", margin: 0 }}>{module.description}</p>
            </div>

            {activeModule === "cognitive" && <CognitiveModule />}
            {activeModule === "visual" && <VisualModule />}
            {activeModule === "hearing" && <HearingModule />}
            {activeModule === "employment" && <EmploymentModule />}
            {activeModule === "mobility" && <MobilityModule />}
          </main>
        </div>
      </div>
    </div>
  );
}

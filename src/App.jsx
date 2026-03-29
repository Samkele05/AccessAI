import { useState, useRef, useEffect } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

function getAnthropicHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (ANTHROPIC_API_KEY) headers["x-api-key"] = ANTHROPIC_API_KEY;
  return headers;
}

function extractAnthropicText(data) {
  const content = data?.content ?? data?.completion;
  if (!content) return "";
  if (Array.isArray(content)) {
    return content.map((item) => item?.text ?? item?.content ?? "").join("");
  }
  return typeof content === "string" ? content : "";
}

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
    description:
      "Paste any complex document, article, or form. AccessAI rewrites it at your chosen reading level — from plain English to ELI5.",
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
    description:
      "Upload any image — a document, photo, chart, or sign. AccessAI describes it in full detail so nothing is out of reach.",
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
    description:
      "Speak naturally and watch your words appear. Or type to have AccessAI generate clear, confident speech for you.",
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
    description:
      "Paste your CV for accessibility-focused feedback, or practise an interview with AI coaching tailored to your needs.",
  },
  {
    id: "mobility",
    icon: "♿",
    title: "Mobility",
    subtitle: "Voice navigation & adaptive controls",
    accent: "#C4B5FD",
    accentDark: "#7C3AED",
    status: "coming-soon",
    tagline: "Move without limits",
    description:
      "Full voice-controlled navigation and one-switch scanning — designed for users who interact without a standard mouse or keyboard.",
  },
];

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

  async function simplify() {
    if (!inputText.trim()) return;
    setLoading(true);
    setError("");
    setOutputText("");

    const levelLabel = READING_LEVELS.find((l) => l.id === level)?.label ?? "plain English";

    try {
      if (!ANTHROPIC_API_KEY) {
        throw new Error("Missing API key. Set VITE_ANTHROPIC_API_KEY in your .env file.");
      }

      const res = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: getAnthropicHeaders(),
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Rewrite the following text at a "${levelLabel}" reading level. 
Keep all the important information but make it as accessible as possible for that level.
Preserve paragraph breaks. Do not add headers unless they were already there.
Return ONLY the rewritten text, nothing else.

TEXT TO SIMPLIFY:
${inputText}`,
            },
          ],
        }),
      });

      const data = await res.json();
      const text = extractAnthropicText(data)?.trim();
      if (!text) throw new Error("No response from AI");
      setOutputText(text);
    } catch (e) {
      setError(e?.message?.includes("Missing API key") ? e.message : "Something went wrong. Please try again.");
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
      {/* Reading level picker */}
      <div>
        <div style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "2px", color: "#64748b", marginBottom: "10px", textTransform: "uppercase" }}>
          Reading level
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {READING_LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                border: level === l.id ? "1.5px solid #6EE7B7" : "1.5px solid rgba(255,255,255,0.1)",
                background: level === l.id ? "rgba(110,231,183,0.12)" : "rgba(255,255,255,0.04)",
                color: level === l.id ? "#6EE7B7" : "#94a3b8",
                fontSize: "12px",
                fontFamily: "'DM Mono', monospace",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {l.label}
              <span style={{ display: "block", fontSize: "10px", opacity: 0.7, marginTop: "2px" }}>{l.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div>
        <div style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "2px", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>
          Paste your text
        </div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste any document, article, form, or message here…"
          rows={6}
          style={{
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
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(110,231,183,0.4)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
      </div>

      {/* Simplify button */}
      <button
        onClick={simplify}
        disabled={loading || !inputText.trim()}
        style={{
          padding: "14px 24px",
          borderRadius: "12px",
          border: "none",
          background: loading || !inputText.trim()
            ? "rgba(110,231,183,0.2)"
            : "linear-gradient(135deg, #6EE7B7, #059669)",
          color: loading || !inputText.trim() ? "#64748b" : "#0f172a",
          fontSize: "14px",
          fontWeight: 700,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "1px",
          cursor: loading || !inputText.trim() ? "not-allowed" : "pointer",
          transition: "all 0.25s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {loading ? (
          <>
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
            Simplifying…
          </>
        ) : (
          "✦ Simplify Text"
        )}
      </button>

      {/* Error */}
      {error && (
        <div style={{ color: "#FCA5A5", fontSize: "13px", padding: "12px 16px", background: "rgba(252,165,165,0.08)", borderRadius: "10px", border: "1px solid rgba(252,165,165,0.2)" }}>
          ⚠ {error}
        </div>
      )}

      {/* Output */}
      {outputText && (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "2px", color: "#6EE7B7", textTransform: "uppercase" }}>
              ✓ Simplified output
            </div>
            <button
              onClick={copyOutput}
              style={{
                background: "transparent",
                border: "1px solid rgba(110,231,183,0.3)",
                color: "#6EE7B7",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "11px",
                fontFamily: "'DM Mono', monospace",
                cursor: "pointer",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div
            style={{
              background: "rgba(110,231,183,0.05)",
              border: "1.5px solid rgba(110,231,183,0.2)",
              borderRadius: "12px",
              padding: "16px",
              color: "#e2e8f0",
              fontSize: "14px",
              fontFamily: "'Lora', serif",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
            }}
          >
            {outputText}
          </div>
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
  const fileRef = useRef();

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(URL.createObjectURL(file));
    setImageType(file.type);
    setDescription("");
    const reader = new FileReader();
    reader.onload = (e) => setImageData(e.target.result.split(",")[1]);
    reader.readAsDataURL(file);
  }

  async function describe() {
    if (!imageData) return;
    setLoading(true);
    setError("");
    setDescription("");

    const promptMap = {
      standard: "Describe this image in detail for someone who cannot see it. Include key objects, people, actions, text, colors, and spatial relationships.",
      detailed: "Provide a very thorough accessibility description of this image. Describe every visible element: objects, people, expressions, text, colors, composition, background, and any implied context or mood.",
      text: "Extract and transcribe ALL text visible in this image, in reading order. Then briefly describe the surrounding context.",
    };

    try {
      if (!ANTHROPIC_API_KEY) {
        throw new Error("Missing API key. Set VITE_ANTHROPIC_API_KEY in your .env file.");
      }

      const res = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: getAnthropicHeaders(),
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: imageType || "image/jpeg", data: imageData } },
              { type: "text", text: promptMap[detail] },
            ],
          }],
        }),
      });
      const data = await res.json();
      const text = extractAnthropicText(data)?.trim();
      if (!text) throw new Error();
      setDescription(text);
    } catch (e) {
      setError(e?.message?.includes("Missing API key") ? e.message : "Couldn't describe image. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        {[["standard","Standard"],["detailed","Detailed"],["text","Text Only"]].map(([id, label]) => (
          <button key={id} onClick={() => setDetail(id)} style={{
            padding: "7px 14px", borderRadius: "8px",
            border: detail === id ? "1.5px solid #FCA5A5" : "1.5px solid rgba(255,255,255,0.1)",
            background: detail === id ? "rgba(252,165,165,0.12)" : "rgba(255,255,255,0.04)",
            color: detail === id ? "#FCA5A5" : "#94a3b8",
            fontSize: "12px", fontFamily: "'DM Mono', monospace", cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      <div
        onClick={() => fileRef.current.click()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: "2px dashed rgba(252,165,165,0.3)", borderRadius: "14px",
          padding: "32px 20px", textAlign: "center", cursor: "pointer",
          background: image ? "transparent" : "rgba(252,165,165,0.04)",
          transition: "all 0.2s",
        }}
      >
        {image ? (
          <img src={image} alt="Uploaded" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "10px", objectFit: "contain" }} />
        ) : (
          <>
            <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>📷</div>
            <div style={{ color: "#94a3b8", fontSize: "13px", fontFamily: "'DM Mono', monospace" }}>Drop an image or click to upload</div>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />

      <button onClick={describe} disabled={loading || !imageData} style={{
        padding: "14px", borderRadius: "12px", border: "none",
        background: loading || !imageData ? "rgba(252,165,165,0.15)" : "linear-gradient(135deg, #FCA5A5, #DC2626)",
        color: loading || !imageData ? "#64748b" : "#fff",
        fontSize: "14px", fontWeight: 700, fontFamily: "'DM Mono', monospace",
        letterSpacing: "1px", cursor: loading || !imageData ? "not-allowed" : "pointer",
      }}>
        {loading ? "⟳ Describing…" : "✦ Describe Image"}
      </button>

      {error && <div style={{ color: "#FCA5A5", fontSize: "13px", padding: "12px", background: "rgba(252,165,165,0.08)", borderRadius: "10px" }}>⚠ {error}</div>}
      {description && (
        <div style={{ background: "rgba(252,165,165,0.05)", border: "1.5px solid rgba(252,165,165,0.2)", borderRadius: "12px", padding: "16px", color: "#e2e8f0", fontSize: "14px", fontFamily: "'Lora', serif", lineHeight: 1.8, whiteSpace: "pre-wrap", animation: "fadeUp 0.4s ease" }}>
          {description}
        </div>
      )}
    </div>
  );
}

// ─── HEARING & SPEECH MODULE ──────────────────────────────────────────────────

function HearingModule() {
  const [mode, setMode] = useState("speech-to-text");
  const [transcript, setTranscript] = useState("");
  const [textToSpeak, setTextToSpeak] = useState("");
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => "SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const recognitionRef = useRef(null);

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-ZA";
    recognition.onresult = (e) => {
      let full = "";
      for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript;
      setTranscript(full);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function speak() {
    if (!textToSpeak.trim()) return;
    const utt = new SpeechSynthesisUtterance(textToSpeak);
    utt.lang = "en-ZA";
    window.speechSynthesis.speak(utt);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        {[["speech-to-text","🎙 Speech → Text"],["text-to-speech","🔊 Text → Speech"]].map(([id, label]) => (
          <button key={id} onClick={() => setMode(id)} style={{
            padding: "8px 14px", borderRadius: "8px",
            border: mode === id ? "1.5px solid #93C5FD" : "1.5px solid rgba(255,255,255,0.1)",
            background: mode === id ? "rgba(147,197,253,0.12)" : "rgba(255,255,255,0.04)",
            color: mode === id ? "#93C5FD" : "#94a3b8",
            fontSize: "12px", fontFamily: "'DM Mono', monospace", cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {mode === "speech-to-text" ? (
        <>
          {!supported && <div style={{ color: "#FCA5A5", fontSize: "13px", padding: "12px", background: "rgba(252,165,165,0.08)", borderRadius: "10px" }}>⚠ Speech recognition not supported in this browser. Try Chrome.</div>}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={listening ? stopListening : startListening}
              disabled={!supported}
              style={{
                width: "80px", height: "80px", borderRadius: "50%",
                border: listening ? "3px solid #FCA5A5" : "3px solid #93C5FD",
                background: listening ? "rgba(252,165,165,0.15)" : "rgba(147,197,253,0.12)",
                fontSize: "2rem", cursor: supported ? "pointer" : "not-allowed",
                transition: "all 0.3s",
                animation: listening ? "pulse-ring 1.5s ease infinite" : "none",
              }}
            >
              {listening ? "⏹" : "🎙"}
            </button>
          </div>
          <div style={{ textAlign: "center", fontSize: "12px", fontFamily: "'DM Mono', monospace", color: listening ? "#93C5FD" : "#64748b" }}>
            {listening ? "Listening… click to stop" : "Click to start recording"}
          </div>
          {transcript && (
            <div style={{ background: "rgba(147,197,253,0.05)", border: "1.5px solid rgba(147,197,253,0.2)", borderRadius: "12px", padding: "16px", color: "#e2e8f0", fontSize: "14px", fontFamily: "'Lora', serif", lineHeight: 1.8, minHeight: "80px", animation: "fadeUp 0.4s ease" }}>
              {transcript}
            </div>
          )}
        </>
      ) : (
        <>
          <textarea
            value={textToSpeak}
            onChange={(e) => setTextToSpeak(e.target.value)}
            placeholder="Type what you want to say…"
            rows={5}
            style={{
              width: "100%", background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.1)",
              borderRadius: "12px", padding: "14px 16px", color: "#e2e8f0",
              fontSize: "14px", fontFamily: "'Lora', serif", lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box",
            }}
          />
          <button onClick={speak} disabled={!textToSpeak.trim()} style={{
            padding: "14px", borderRadius: "12px", border: "none",
            background: !textToSpeak.trim() ? "rgba(147,197,253,0.15)" : "linear-gradient(135deg, #93C5FD, #2563EB)",
            color: !textToSpeak.trim() ? "#64748b" : "#fff",
            fontSize: "14px", fontWeight: 700, fontFamily: "'DM Mono', monospace",
            letterSpacing: "1px", cursor: !textToSpeak.trim() ? "not-allowed" : "pointer",
          }}>
            🔊 Speak Text
          </button>
        </>
      )}
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

  const placeholders = {
    cv: "Paste your CV here…",
    interview: "Paste a job description or interview question here…",
    cover: "Paste the job description here (we'll write the cover letter)…",
  };

  async function generate() {
    if (!input.trim()) return;
    setLoading(true); setError(""); setOutput("");

    const prompts = {
      cv: `You are an accessibility-focused career coach in South Africa. Review this CV and give:
1. Three strengths
2. Three specific improvements for clarity and accessibility
3. One tip for candidates with disabilities navigating the job market

CV:
${input}`,
      interview: `You are an inclusive hiring coach. The user has shared this job description or interview question:

${input}

${role ? `Target role: ${role}` : ""}

Provide: 1) Key points to address, 2) A strong example answer structure, 3) One tip for disclosing a disability (if relevant).`,
      cover: `Write a clear, confident cover letter for this job description. Make it accessible in language — plain English, no jargon. End with a professional closing.

Job description:
${input}`,
    };

    try {
      if (!ANTHROPIC_API_KEY) {
        throw new Error("Missing API key. Set VITE_ANTHROPIC_API_KEY in your .env file.");
      }

      const res = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: getAnthropicHeaders(),
        body: JSON.stringify({
          model: MODEL, max_tokens: 1000,
          messages: [{ role: "user", content: prompts[mode] }],
        }),
      });
      const data = await res.json();
      const text = extractAnthropicText(data)?.trim();
      if (!text) throw new Error();
      setOutput(text);
    } catch (e) {
      setError(e?.message?.includes("Missing API key") ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const accent = "#FDE68A";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {EMPLOYMENT_MODES.map(({ id, label }) => (
          <button key={id} onClick={() => { setMode(id); setOutput(""); }} style={{
            padding: "7px 14px", borderRadius: "8px",
            border: mode === id ? `1.5px solid ${accent}` : "1.5px solid rgba(255,255,255,0.1)",
            background: mode === id ? "rgba(253,230,138,0.1)" : "rgba(255,255,255,0.04)",
            color: mode === id ? accent : "#94a3b8",
            fontSize: "12px", fontFamily: "'DM Mono', monospace", cursor: "pointer",
          }}>{label}</button>
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
        />
      )}

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholders[mode]}
        rows={6}
        style={{
          width: "100%", background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.1)",
          borderRadius: "12px", padding: "14px 16px", color: "#e2e8f0",
          fontSize: "14px", fontFamily: "'Lora', serif", lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box",
        }}
      />

      <button onClick={generate} disabled={loading || !input.trim()} style={{
        padding: "14px", borderRadius: "12px", border: "none",
        background: loading || !input.trim() ? "rgba(253,230,138,0.15)" : "linear-gradient(135deg, #FDE68A, #D97706)",
        color: loading || !input.trim() ? "#64748b" : "#0f172a",
        fontSize: "14px", fontWeight: 700, fontFamily: "'DM Mono', monospace",
        letterSpacing: "1px", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
      }}>
        {loading ? "⟳ Generating…" : "✦ Generate"}
      </button>

      {error && <div style={{ color: "#FCA5A5", fontSize: "13px", padding: "12px", background: "rgba(252,165,165,0.08)", borderRadius: "10px" }}>⚠ {error}</div>}
      {output && (
        <div style={{ background: "rgba(253,230,138,0.05)", border: `1.5px solid rgba(253,230,138,0.2)`, borderRadius: "12px", padding: "16px", color: "#e2e8f0", fontSize: "14px", fontFamily: "'Lora', serif", lineHeight: 1.8, whiteSpace: "pre-wrap", animation: "fadeUp 0.4s ease" }}>
          {output}
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
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", fontFamily: "'DM Mono', monospace", fontSize: "13px" }}>
      🚧 This module is coming soon
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function AccessAI() {
  const [activeModule, setActiveModule] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080d14",
      fontFamily: "'Lora', Georgia, serif",
      color: "#e2e8f0",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&family=Bebas+Neue&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::selection { background: rgba(110,231,183,0.25); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(147,197,253,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(147,197,253,0); }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        .module-card {
          cursor: pointer;
          border-radius: 20px;
          padding: 28px 24px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(10px);
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        .module-card:hover {
          transform: translateY(-5px) scale(1.01);
          border-color: rgba(255,255,255,0.15);
        }

        .module-card.card-0 { animation: fadeUp 0.5s ease 0.05s both; }
        .module-card.card-1 { animation: fadeUp 0.5s ease 0.12s both; }
        .module-card.card-2 { animation: fadeUp 0.5s ease 0.19s both; }
        .module-card.card-3 { animation: fadeUp 0.5s ease 0.26s both; }
        .module-card.card-4 { animation: fadeUp 0.5s ease 0.33s both; }

        .module-card .hover-glow {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.3s;
          border-radius: 20px;
          pointer-events: none;
        }

        .module-card:hover .hover-glow { opacity: 1; }

        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 50;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .drawer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          max-height: 90vh;
          border-radius: 24px 24px 0 0;
          z-index: 51;
          overflow-y: auto;
          animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 3px 9px;
          border-radius: 20px;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: blink 1.4s ease infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .hero-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(3.5rem, 10vw, 6.5rem);
          line-height: 0.95;
          letter-spacing: 2px;
          color: #fff;
        }

        .hero-accent {
          background: linear-gradient(90deg, #6EE7B7, #93C5FD, #FDE68A, #FCA5A5);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .noise-overlay {
          position: fixed;
          inset: 0;
          opacity: 0.025;
          pointer-events: none;
          z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }

        .grid-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

      <div className="noise-overlay" />
      <div className="grid-bg" />

      {/* ── HEADER ── */}
      <div style={{ position: "relative", zIndex: 1, padding: "48px 28px 0" }}>

        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "52px" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "3px", color: "#475569", textTransform: "uppercase" }}>
            AccessAI · v1
          </div>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "1px",
            color: "#334155", padding: "5px 12px",
            border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px",
          }}>
            Isazi Hackathon 2025
          </div>
        </div>

        {/* Hero */}
        <div style={{ maxWidth: "700px", marginBottom: "60px" }}>
          <h1 className="hero-title">
            ACCESS<br />
            <span className="hero-accent">FOR ALL</span>
          </h1>
          <p style={{
            marginTop: "24px",
            fontFamily: "'Lora', serif",
            fontSize: "16px",
            color: "#64748b",
            lineHeight: 1.75,
            maxWidth: "480px",
            fontStyle: "italic",
          }}>
            One platform. Five accessibility challenges. Real AI-powered tools for employment, vision, hearing, cognition, and mobility.
          </p>
          <div style={{ display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap" }}>
            {[
              { color: "#6EE7B7", label: "Cognitive — Live" },
              { color: "#FCA5A5", label: "Visual — Live" },
              { color: "#93C5FD", label: "Hearing — Live" },
              { color: "#FDE68A", label: "Employment — Live" },
            ].map(({ color, label }) => (
              <div key={label} className="live-badge" style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
                <div className="live-dot" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MODULE GRID ── */}
      <div style={{
        position: "relative", zIndex: 1,
        padding: "0 28px 80px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "14px",
      }}>
        {MODULES.map((mod, i) => (
          <div
            key={mod.id}
            className={`module-card card-${i}`}
            onClick={() => mod.status !== "coming-soon" && setActiveModule(mod)}
            style={{
              cursor: mod.status === "coming-soon" ? "default" : "pointer",
              opacity: mod.status === "coming-soon" ? 0.5 : 1,
            }}
          >
            {/* Hover glow */}
            <div className="hover-glow" style={{ background: `radial-gradient(ellipse at top left, ${mod.accent}18, transparent 65%)` }} />

            {/* Corner accent line */}
            <div style={{
              position: "absolute", top: 0, left: "24px", right: "24px", height: "1px",
              background: `linear-gradient(90deg, transparent, ${mod.accent}60, transparent)`,
            }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <span style={{ fontSize: "2rem" }}>{mod.icon}</span>
              <div className="live-badge" style={{
                background: mod.status === "live" ? `${mod.accent}15` : "rgba(255,255,255,0.05)",
                border: `1px solid ${mod.status === "live" ? mod.accent + "40" : "rgba(255,255,255,0.08)"}`,
                color: mod.status === "live" ? mod.accent : "#475569",
              }}>
                {mod.status === "live" && <div className="live-dot" style={{ background: mod.accent }} />}
                {mod.status === "live" ? "Live" : "Soon"}
              </div>
            </div>

            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.55rem", letterSpacing: "1px", color: "#f1f5f9", marginBottom: "4px" }}>
              {mod.title}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", fontFamily: "'DM Mono', monospace", lineHeight: 1.5, marginBottom: "16px" }}>
              {mod.subtitle}
            </div>
            <div style={{ fontFamily: "'Lora', serif", fontSize: "12px", fontStyle: "italic", color: mod.accent, opacity: 0.85 }}>
              "{mod.tagline}"
            </div>

            {mod.status === "live" && (
              <div style={{
                marginTop: "20px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: `${mod.accent}10`,
                border: `1px solid ${mod.accent}25`,
                fontSize: "11px",
                fontFamily: "'DM Mono', monospace",
                color: mod.accent,
                textAlign: "center",
                letterSpacing: "1px",
              }}>
                Open module →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── DRAWER ── */}
      {activeModule && (
        <>
          <div className="drawer-overlay" onClick={() => setActiveModule(null)} />
          <div
            className="drawer"
            style={{ background: "#0d1520", border: `1px solid ${activeModule.accent}20`, borderBottom: "none" }}
          >
            {/* Drawer handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
              <div style={{ width: "40px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.1)" }} />
            </div>

            {/* Drawer header */}
            <div style={{
              padding: "20px 28px 24px",
              borderBottom: `1px solid ${activeModule.accent}15`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{ fontSize: "1.8rem" }}>{activeModule.icon}</span>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", letterSpacing: "1px", color: activeModule.accent, lineHeight: 1 }}>
                    {activeModule.title}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#475569", marginTop: "4px" }}>
                    {activeModule.description}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveModule(null)}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94a3b8", borderRadius: "50%", width: "34px", height: "34px",
                  cursor: "pointer", fontSize: "14px", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Drawer content */}
            <div style={{ padding: "24px 28px 48px" }}>
              <ModuleContent module={activeModule} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

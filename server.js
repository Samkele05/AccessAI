import express from "express";
import cors from "cors";
import multer from "multer";
import { OpenAI } from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// ─── COGNITIVE: Text Simplification ──────────────────────────────────────────
app.post("/api/cognitive/simplify", async (req, res) => {
  const { text, level } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "No text provided" });

  const levelMap = {
    eli5: "a 5-year-old child (use very simple words, short sentences, fun analogies)",
    simple: "plain English (clear, direct, no jargon, short sentences)",
    teen: "a teenager at grade 8-10 level (conversational but informative)",
    adult: "a standard adult reading level (clear but complete)",
  };
  const levelDesc = levelMap[level] || levelMap.simple;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content: `You are an accessibility expert who rewrites text to be more readable. You always return ONLY the rewritten text with no preamble, no meta-commentary, no headers unless they were in the original.`,
        },
        {
          role: "user",
          content: `Rewrite the following text for ${levelDesc}. Keep all important information. Preserve paragraph breaks. Return ONLY the rewritten text.\n\nTEXT:\n${text}`,
        },
      ],
    });
    const simplified = response.choices[0]?.message?.content?.trim();
    if (!simplified) throw new Error("Empty response");
    res.json({ simplified });
  } catch (e) {
    console.error("Cognitive error:", e.message);
    res.status(500).json({ error: "Failed to simplify text. Please try again." });
  }
});

// ─── VISUAL: Image Description ────────────────────────────────────────────────
app.post("/api/visual/describe", async (req, res) => {
  const { imageData, imageType, detail } = req.body;
  if (!imageData) return res.status(400).json({ error: "No image provided" });

  const promptMap = {
    standard: "Describe this image in detail for someone who cannot see it. Include key objects, people, actions, text, colors, and spatial relationships. Be thorough but concise.",
    detailed: "Provide a very thorough accessibility description of this image. Describe every visible element: objects, people, facial expressions, text, colors, composition, background, lighting, and any implied context or mood. Be as descriptive as possible.",
    text: "Extract and transcribe ALL text visible in this image, in reading order. Preserve formatting where possible. Then briefly describe what the image shows overall.",
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${imageType || "image/jpeg"};base64,${imageData}` },
            },
            { type: "text", text: promptMap[detail] || promptMap.standard },
          ],
        },
      ],
    });
    const description = response.choices[0]?.message?.content?.trim();
    if (!description) throw new Error("Empty response");
    res.json({ description });
  } catch (e) {
    console.error("Visual error:", e.message);
    res.status(500).json({ error: "Failed to describe image. Please try again." });
  }
});

// ─── HEARING: Transcription (audio file upload) ───────────────────────────────
app.post("/api/hearing/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No audio file provided" });

  try {
    // Write buffer to temp file for Whisper
    const tmpPath = `/tmp/audio_${Date.now()}.webm`;
    fs.writeFileSync(tmpPath, req.file.buffer);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: "whisper-1",
      language: "en",
    });

    fs.unlinkSync(tmpPath);
    res.json({ transcript: transcription.text });
  } catch (e) {
    console.error("Hearing transcribe error:", e.message);
    res.status(500).json({ error: "Failed to transcribe audio. Please try again." });
  }
});

// ─── HEARING: Text-to-Speech ──────────────────────────────────────────────────
app.post("/api/hearing/speak", async (req, res) => {
  const { text, voice } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "No text provided" });

  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice || "nova",
      input: text.slice(0, 4096),
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.set("Content-Type", "audio/mpeg");
    res.set("Content-Length", buffer.length);
    res.send(buffer);
  } catch (e) {
    console.error("TTS error:", e.message);
    res.status(500).json({ error: "Failed to generate speech. Please try again." });
  }
});

// ─── EMPLOYMENT: CV / Interview / Cover Letter ────────────────────────────────
app.post("/api/employment/generate", async (req, res) => {
  const { mode, input, role } = req.body;
  if (!input?.trim()) return res.status(400).json({ error: "No input provided" });

  const systemPrompts = {
    cv: "You are an accessibility-focused career coach based in South Africa. You give honest, constructive, and encouraging feedback. Format your response with clear sections using markdown-style bold headers.",
    interview: "You are an inclusive hiring coach who helps people with disabilities prepare for job interviews. You give practical, confidence-building advice. Use clear numbered lists.",
    cover: "You are an expert cover letter writer. You write clear, confident, professional cover letters in plain English with no jargon. You write in first person as the applicant.",
  };

  const userPrompts = {
    cv: `Review this CV and provide:\n\n**Strengths (3)**\nList three genuine strengths of this CV.\n\n**Improvements (3)**\nList three specific, actionable improvements for clarity and accessibility.\n\n**Disability Navigation Tip**\nOne practical tip for candidates with disabilities navigating the South African job market.\n\nCV:\n${input}`,
    interview: `The user is preparing for an interview${role ? ` for the role of ${role}` : ""}.\n\nHere is the job description or question they need help with:\n${input}\n\nProvide:\n1. Key points to address in your answer\n2. A strong STAR-format answer structure with an example\n3. One tip specifically for disclosing a disability (if relevant) during the interview process`,
    cover: `Write a complete, professional cover letter for this job description. Use plain English, no jargon. Be confident and specific. End with a professional closing.\n\nJob description:\n${input}`,
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      max_tokens: 1500,
      messages: [
        { role: "system", content: systemPrompts[mode] || systemPrompts.cv },
        { role: "user", content: userPrompts[mode] || userPrompts.cv },
      ],
    });
    const output = response.choices[0]?.message?.content?.trim();
    if (!output) throw new Error("Empty response");
    res.json({ output });
  } catch (e) {
    console.error("Employment error:", e.message);
    res.status(500).json({ error: "Failed to generate response. Please try again." });
  }
});

// ─── MOBILITY: Voice Command Interpretation ───────────────────────────────────
app.post("/api/mobility/command", async (req, res) => {
  const { command, context } = req.body;
  if (!command?.trim()) return res.status(400).json({ error: "No command provided" });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: `You are an accessibility assistant that interprets voice navigation commands. 
Given a voice command, respond with a JSON object:
{
  "action": "scroll_up|scroll_down|click|navigate|zoom_in|zoom_out|read_page|go_back|go_forward|focus_next|focus_prev|custom",
  "target": "description of what to interact with (if applicable)",
  "feedback": "A short, friendly confirmation message to read aloud to the user (max 15 words)",
  "magnitude": "small|medium|large (for scroll/zoom actions)"
}
Only return valid JSON, nothing else.`,
        },
        {
          role: "user",
          content: `Voice command: "${command}"\nPage context: ${context || "general web page"}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { action: "custom", target: command, feedback: "Got it, trying that now.", magnitude: "medium" };
    }
    res.json(parsed);
  } catch (e) {
    console.error("Mobility error:", e.message);
    res.status(500).json({ error: "Failed to process command." });
  }
});

// ─── SERVE STATIC IN PRODUCTION ───────────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AccessAI API server running on http://localhost:${PORT}`);
});

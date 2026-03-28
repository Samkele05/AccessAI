import { useState } from "react";

const modules = [
  {
    id: "visual",
    icon: "👁",
    title: "Visual",
    subtitle: "See the world differently",
    color: "#FF6B35",
    bg: "#1a0a00",
    desc: "AI tools for the blind & low vision community",
    status: "coming soon",
  },
  {
    id: "hearing",
    icon: "👂",
    title: "Hearing & Speech",
    subtitle: "Every voice deserves to be heard",
    color: "#00C9A7",
    bg: "#001a15",
    desc: "Real-time captions, sign language & speech tools",
    status: "coming soon",
  },
  {
    id: "mobility",
    icon: "♿",
    title: "Mobility",
    subtitle: "Move without limits",
    color: "#4A90E2",
    bg: "#000d1a",
    desc: "Navigation, adaptive controls & physical assistance",
    status: "coming soon",
  },
  {
    id: "cognitive",
    icon: "🧠",
    title: "Cognitive",
    subtitle: "Think, learn & communicate freely",
    color: "#B06BFF",
    bg: "#0d001a",
    desc: "Memory aids, simplifiers & focus tools",
    status: "coming soon",
  },
  {
    id: "employment",
    icon: "💼",
    title: "Employment",
    subtitle: "Equal opportunity, always",
    color: "#FFD93D",
    bg: "#1a1500",
    desc: "Job matching, accessible workplace tools & support",
    status: "coming soon",
  },
];

export default function AccessAI() {
  const [active, setActive] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      fontFamily: "'Georgia', serif",
      color: "#fff",
      padding: "0",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Playfair+Display:wght@700;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .card {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 28px 24px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
          background: rgba(255,255,255,0.03);
        }

        .card::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: 20px;
        }

        .card:hover {
          transform: translateY(-6px) scale(1.02);
          border-color: rgba(255,255,255,0.2);
        }

        .card:hover::before { opacity: 1; }

        .card.active {
          transform: scale(0.97);
        }

        .icon {
          font-size: 2.4rem;
          margin-bottom: 14px;
          display: block;
        }

        .tag {
          display: inline-block;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 20px;
          margin-top: 12px;
          opacity: 0.7;
        }

        .pulse {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .card:nth-child(1) { animation: fadeUp 0.5s ease 0.1s both; }
        .card:nth-child(2) { animation: fadeUp 0.5s ease 0.2s both; }
        .card:nth-child(3) { animation: fadeUp 0.5s ease 0.3s both; }
        .card:nth-child(4) { animation: fadeUp 0.5s ease 0.4s both; }
        .card:nth-child(5) { animation: fadeUp 0.5s ease 0.5s both; }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 24px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal {
          background: #111;
          border-radius: 24px;
          padding: 40px 32px;
          max-width: 400px;
          width: 100%;
          border: 1px solid rgba(255,255,255,0.1);
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }

        .close-btn {
          background: rgba(255,255,255,0.08);
          border: none;
          color: #fff;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .close-btn:hover { background: rgba(255,255,255,0.15); }

        .launch-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          letter-spacing: 1px;
          cursor: pointer;
          margin-top: 24px;
          opacity: 0.5;
          color: #000;
          font-weight: bold;
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "48px 28px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "11px",
          letterSpacing: "4px",
          color: "rgba(255,255,255,0.4)",
          textTransform: "uppercase",
          marginBottom: "12px",
        }}>
          Isazi Hackathon 2025
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(2.4rem, 8vw, 3.4rem)",
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-1px",
        }}>
          Access<span style={{ color: "#FF6B35" }}>AI</span>
        </h1>
        <p style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "12px",
          color: "rgba(255,255,255,0.4)",
          marginTop: "10px",
          lineHeight: 1.6,
        }}>
          One platform. Five accessibility frontiers.
        </p>
      </div>

      {/* Grid */}
      <div style={{
        padding: "28px 20px 40px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "14px",
      }}>
        {modules.map((mod) => (
          <div
            key={mod.id}
            className={`card ${active?.id === mod.id ? "active" : ""}`}
            style={{
              gridColumn: mod.id === "employment" ? "1 / -1" : "auto",
            }}
            onClick={() => setActive(mod)}
          >
            <div style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse at top left, ${mod.color}15, transparent 70%)`,
              borderRadius: "20px",
              pointerEvents: "none",
            }} />
            <span className="icon">{mod.icon}</span>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.2rem",
              fontWeight: 700,
              marginBottom: "4px",
            }}>{mod.title}</div>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "10px",
              color: mod.color,
              lineHeight: 1.5,
            }}>{mod.subtitle}</div>
            <div className="tag" style={{
              background: `${mod.color}18`,
              color: mod.color,
              border: `1px solid ${mod.color}30`,
            }}>
              <span className="pulse" style={{ background: mod.color }} />
              building
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center",
        padding: "0 24px 48px",
        fontFamily: "'Space Mono', monospace",
        fontSize: "10px",
        color: "rgba(255,255,255,0.2)",
        letterSpacing: "2px",
      }}>
        TAP A MODULE TO EXPLORE →
      </div>

      {/* Modal */}
      {active && (
        <div className="modal-overlay" onClick={() => setActive(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <span style={{ fontSize: "2rem" }}>{active.icon}</span>
              <button className="close-btn" onClick={() => setActive(null)}>✕</button>
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.8rem",
              fontWeight: 900,
              color: active.color,
              marginBottom: "8px",
            }}>{active.title}</h2>
            <p style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.8,
            }}>{active.desc}</p>
            <div style={{
              marginTop: "20px",
              padding: "16px",
              borderRadius: "12px",
              background: `${active.color}10`,
              border: `1px dashed ${active.color}40`,
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.7,
            }}>
              🚧 This module is being built right now at the hackathon. Come back soon.
            </div>
            <button className="launch-btn" style={{ background: active.color }} disabled>
              COMING SOON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";

const modules = [
  {
    id: "visual",
    icon: "👁",
    title: "Visual",
    subtitle: "See the world differently",
    color: "#FF6B35",
    bg: "#1a0a00",
    status: "coming soon",
  },
  {
    id: "hearing",
    icon: "👂",
    title: "Hearing & Speech",
    subtitle: "Every voice deserves to be heard",
    color: "#00C9A7",
    bg: "#001a15",
    status: "coming soon",
  },
  {
    id: "mobility",
    icon: "♿",
    title: "Mobility",
    subtitle: "Move without limits",
    color: "#4A90E2",
    bg: "#000d1a",
    status: "coming soon",
  },
  {
    id: "cognitive",
    icon: "🧠",
    title: "Cognitive",
    subtitle: "Think, learn & communicate freely",
    color: "#B06BFF",
    bg: "#0d001a",
    status: "coming soon",
  },
  {
    id: "employment",
    icon: "💼",
    title: "Employment",
    subtitle: "Equal opportunity, always",
    color: "#FFD93D",
    bg: "#1a1500",
    status: "coming soon",
  },
];

export default function AccessAI() {
  const [active, setActive] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #f7f8fc 0%, #e9edf8 45%, #eef1f6 100%)",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: "#0f172a",
      padding: "0",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .card {
          border: 1px solid rgba(14, 76, 166, 0.16);
          border-radius: 20px;
          padding: 26px 24px;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          position: relative;
          overflow: hidden;
          background: rgba(255,255,255,0.9);
          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);
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
        padding: "40px 22px 22px",
        borderBottom: "1px solid rgba(15, 23, 42, 0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              letterSpacing: "2px",
              color: "#4b5563",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}>
              AccessAI
            </div>
            <h1 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(2rem, 5vw, 2.8rem)",
              fontWeight: 700,
              lineHeight: 1.05,
              color: "#0f172a",
              marginBottom: "8px",
            }}>
              Accessibility transformed
            </h1>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              color: "#475569",
              lineHeight: 1.6,
              maxWidth: "530px",
            }}>
              Inspired by Apple clarity, Google simplicity, and Nike momentum. Choose a focus area and experience AI-powered assistive tools for every ability.
            </p>
          </div>
          <button style={{
            background: "linear-gradient(90deg, #2f6df1 0%, #10b981 100%)",
            border: "none",
            color: "#fff",
            padding: "11px 20px",
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            cursor: "pointer",
            transition: "transform 0.2s ease",
          }}
            onClick={() => window.scrollTo({ top: 340, behavior: 'smooth' })}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Explore modules
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        padding: "28px 20px 42px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "16px",
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
              fontFamily: "'Inter', sans-serif",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: "4px",
            }}>{mod.title}</div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              color: "#475569",
              lineHeight: 1.4,
            }}>{mod.subtitle}</div>
            <div className="tag" style={{
              background: "#e2e8f0",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
            }}>
              {mod.status === 'coming soon' ? 'Soon' : 'Live'}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center",
        padding: "0 24px 44px",
        fontFamily: "'Inter', sans-serif",
        fontSize: "12px",
        color: "#64748b",
        letterSpacing: "0.6px",
      }}>
        Choose a module above to view details and join the accessibility mission.
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
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              color: "#334155",
              lineHeight: 1.7,
            }}>{active.subtitle}</p>
            <div style={{
              marginTop: "20px",
              padding: "16px",
              borderRadius: "12px",
              background: `${active.color}10`,
              border: `1px dashed ${active.color}40`,
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              color: "#334155",
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

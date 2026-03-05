"use client";

import { useState } from "react";

/* ─── Shared mock data ─── */
const SAMPLE_SKILLS = [
  { name: "Curriculum Builder Pro", category: "Teaching & Pedagogy", author: "Dr. Sarah Chen", installs: "2.4k", badge: "Expert Verified" },
  { name: "Essay Feedback Engine", category: "Assessment & Grading", author: "EduTools Lab", installs: "1.8k", badge: "Bot Verified" },
  { name: "IEP Goal Writer", category: "Special Education", author: "InclusiveAI", installs: "950", badge: "Community" },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CONCEPT 1 — "The Academic Terminal"
   Full terminal/CLI aesthetic + warm education colors
   JetBrains Mono + IBM Plex Sans
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function Concept1() {
  return (
    <div style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", background: "#FAFAF8", color: "#1a1a1a" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #E8E5DF", background: "rgba(250,250,248,0.9)", backdropFilter: "blur(12px)", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18 }}>
              <span style={{ color: "#D4652E" }}>edu</span>SkillsMP
            </span>
            <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
              {["$ browse --skills", "$ cd /categories", "$ --pricing", "$ submit"].map((cmd) => (
                <a key={cmd} href="#" style={{ color: "#6B6459", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, textDecoration: "none" }}>{cmd}</a>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="#" style={{ fontSize: 13, color: "#6B6459", textDecoration: "none" }}>Your Refinery</a>
            <button style={{ background: "linear-gradient(to right, #E07A2F, #D4652E)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Sign In</button>
          </div>
        </div>
      </nav>

      {/* Hero — terminal window */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px 48px" }}>
        <div style={{ background: "#2D2A24", borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
          {/* Title bar */}
          <div style={{ background: "#3D3930", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F57" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#FEBC2E" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28C840" }} />
            <span style={{ marginLeft: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#9B9485" }}>eduSkillsMP — zsh</span>
          </div>
          {/* Terminal content */}
          <div style={{ padding: "24px 24px 32px", fontFamily: "'JetBrains Mono', monospace", fontSize: 14, lineHeight: 1.8, color: "#E8E5DF" }}>
            <div><span style={{ color: "#D4652E" }}>$</span> <span style={{ color: "#7EB77F" }}>eduSkillsMP</span> --description</div>
            <div style={{ color: "#9B9485", marginBottom: 16 }}># The Edu Skills Marketplace for Claude</div>
            <div><span style={{ color: "#D4652E" }}>$</span> <span style={{ color: "#7EB77F" }}>browse</span> --count</div>
            <div style={{ color: "#E8C547" }}>→ 42 skills across 8 categories</div>
            <div style={{ marginTop: 16 }}><span style={{ color: "#D4652E" }}>$</span> <span style={{ color: "#7EB77F" }}>search</span> <span style={{ color: "#D4B896" }}>&quot;curriculum design&quot;</span></div>
            <div style={{ marginTop: 8 }}>
              <span style={{ background: "#D4652E", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>searching...</span>
            </div>
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: 24, color: "#6B6459", fontSize: 15 }}>
          Browse, install, and personalize verified education skills for Claude.
        </p>
      </section>

      {/* How it works — terminal steps */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { cmd: "browse", desc: "Find skills across education categories, verified for quality." },
            { cmd: "install --skill", desc: "One-click install for Claude Desktop, Code, or project file." },
            { cmd: "refine --context", desc: "Upload docs & assets — AI generates personalized context." },
          ].map((item, i) => (
            <div key={i} style={{ background: "#F5F3EF", borderRadius: 10, padding: 20, border: "1px solid #E8E5DF" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#D4652E", marginBottom: 8 }}>
                <span style={{ color: "#6B6459" }}>$</span> {item.cmd}
              </div>
              <p style={{ fontSize: 13, color: "#6B6459", margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Skill cards — code editor style */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 48px" }}>
        <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, marginBottom: 16, color: "#1a1a1a" }}>
          <span style={{ color: "#D4652E" }}>#</span> Featured Skills
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {SAMPLE_SKILLS.map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid #E8E5DF", cursor: "pointer" }}>
              {/* Mini title bar */}
              <div style={{ background: "#F5F3EF", padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid #E8E5DF" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F57" }} />
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FEBC2E" }} />
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#28C840" }} />
                <span style={{ marginLeft: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#9B9485" }}>{s.name.toLowerCase().replace(/ /g, "-")}.md</span>
              </div>
              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>{s.name}</h3>
                <p style={{ fontSize: 12, color: "#6B6459", margin: "0 0 12px" }}>by {s.author}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#9B9485" }}>{s.installs} installs</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: s.badge === "Expert Verified" ? "#DCFCE7" : s.badge === "Bot Verified" ? "#DBEAFE" : "#F3F4F6", color: s.badge === "Expert Verified" ? "#166534" : s.badge === "Bot Verified" ? "#1E40AF" : "#374151" }}>{s.badge}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Color palette swatch */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 48px" }}>
        <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#9B9485", marginBottom: 12 }}>{"// color palette"}</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { color: "#FAFAF8", label: "Background" },
            { color: "#F5F3EF", label: "Surface" },
            { color: "#2D2A24", label: "Terminal" },
            { color: "#D4652E", label: "Accent" },
            { color: "#7EB77F", label: "Success" },
            { color: "#E8C547", label: "Warning" },
            { color: "#6B6459", label: "Muted" },
          ].map((c) => (
            <div key={c.label} style={{ textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: c.color, border: "1px solid #E8E5DF" }} />
              <span style={{ fontSize: 10, color: "#9B9485", fontFamily: "'JetBrains Mono', monospace", display: "block", marginTop: 4 }}>{c.label}</span>
              <span style={{ fontSize: 9, color: "#bbb", fontFamily: "'JetBrains Mono', monospace" }}>{c.color}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CONCEPT 2 — "Warm Scholar"
   Clean marketplace + subtle code accents
   Space Grotesk + DM Sans + Fira Code
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function Concept2() {
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#FAF9F7", color: "#1a1a1a" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #E8E4DD", background: "rgba(250,249,247,0.92)", backdropFilter: "blur(12px)", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>
              <span style={{ color: "#1E3A5F" }}>edu</span>SkillsMP
            </span>
            <div style={{ display: "flex", gap: 20, fontSize: 14 }}>
              {["Browse", "How It Works", "Pricing", "Submit"].map((item) => (
                <a key={item} href="#" style={{ color: "#5C5549", textDecoration: "none" }}>{item}</a>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="#" style={{ fontSize: 13, color: "#5C5549", textDecoration: "none" }}>Your Refinery</a>
            <button style={{ background: "#D4652E", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Sign In</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px 56px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 44, fontWeight: 700, lineHeight: 1.15, margin: "0 0 16px" }}>
          The Edu Skills Marketplace
          <br />
          <span style={{ color: "#1E3A5F" }}>for Claude</span>
        </h1>
        <p style={{ fontSize: 17, color: "#6B6459", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.6 }}>
          Browse, install, and personalize verified skills.{" "}
          <span style={{ fontWeight: 600, color: "#3D3930" }}>42 skills</span> across{" "}
          <span style={{ fontWeight: 600, color: "#3D3930" }}>8 categories</span>.
        </p>
        <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
          <input
            type="text"
            placeholder="Search skills..."
            style={{ width: "100%", padding: "12px 16px 12px 40px", borderRadius: 10, border: "1px solid #E8E4DD", background: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            readOnly
          />
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9B9485", fontSize: 16 }}>&#x1F50D;</span>
        </div>
      </section>

      {/* How it works — warm cards */}
      <section style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { step: "1", title: "Browse", desc: "Find verified skills across education categories." },
            { step: "2", title: "Install", desc: "One-click install for Claude Desktop, Code, or projects." },
            { step: "3", title: "Add Context", desc: "Upload docs — AI generates personalized context." },
          ].map((item) => (
            <div key={item.step} style={{ textAlign: "center", padding: 24, borderRadius: 12, background: "#F5F2ED" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1E3A5F", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 14, fontWeight: 700 }}>{item.step}</div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, margin: "0 0 6px", fontSize: 15 }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: "#6B6459", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Skill cards — clean with subtle code header */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 48px" }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Featured Skills</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {SAMPLE_SKILLS.map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #E8E4DD", cursor: "pointer", transition: "box-shadow 0.2s" }}>
              {/* Thin code accent bar */}
              <div style={{ background: "#1E3A5F", height: 3 }} />
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "#EDE9E3", color: "#6B6459", fontFamily: "'Fira Code', monospace" }}>{s.category}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: s.badge === "Expert Verified" ? "#DCFCE7" : s.badge === "Bot Verified" ? "#DBEAFE" : "#F3F4F6", color: s.badge === "Expert Verified" ? "#166534" : s.badge === "Bot Verified" ? "#1E40AF" : "#374151" }}>{s.badge}</span>
                </div>
                <h3 style={{ fontSize: 16, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, margin: "0 0 4px" }}>{s.name}</h3>
                <p style={{ fontSize: 13, color: "#6B6459", margin: "0 0 16px" }}>by {s.author}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#9B9485" }}>{s.installs} installs</span>
                  <button style={{ background: "#D4652E", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Install</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#1E3A5F", padding: "48px 24px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Have a skill to share?</h2>
        <p style={{ color: "#94A9C0", marginBottom: 20, fontSize: 14 }}>Submit your Claude skill to the marketplace.</p>
        <button style={{ background: "#D4652E", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Submit a Skill</button>
      </section>

      {/* Color palette */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <h3 style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: "#9B9485", marginBottom: 12 }}>{"// color palette"}</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { color: "#FAF9F7", label: "Background" },
            { color: "#F5F2ED", label: "Surface" },
            { color: "#1E3A5F", label: "Primary" },
            { color: "#D4652E", label: "CTA" },
            { color: "#EDE9E3", label: "Muted" },
            { color: "#6B6459", label: "Text Secondary" },
            { color: "#3D3930", label: "Text Primary" },
          ].map((c) => (
            <div key={c.label} style={{ textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: c.color, border: "1px solid #E8E4DD" }} />
              <span style={{ fontSize: 10, color: "#9B9485", fontFamily: "'Fira Code', monospace", display: "block", marginTop: 4 }}>{c.label}</span>
              <span style={{ fontSize: 9, color: "#bbb", fontFamily: "'Fira Code', monospace" }}>{c.color}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CONCEPT 3 — "Code Campus"
   Dark terminal hero → warm cream marketplace body
   Fira Code + Poppins + Inter
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function Concept3() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#1a1a1a" }}>
      {/* Dark Nav */}
      <nav style={{ background: "#0F172A", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <span style={{ fontFamily: "'Fira Code', monospace", fontWeight: 700, fontSize: 18, color: "#F59E0B" }}>
              edu<span style={{ color: "#E2E8F0" }}>SkillsMP</span>
            </span>
            <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
              {["Browse", "How It Works", "Pricing", "Submit"].map((item) => (
                <a key={item} href="#" style={{ color: "#94A3B8", textDecoration: "none" }}>{item}</a>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="#" style={{ fontSize: 13, color: "#94A3B8", textDecoration: "none" }}>Your Refinery</a>
            <button style={{ background: "#F59E0B", color: "#0F172A", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Sign In</button>
          </div>
        </div>
      </nav>

      {/* Dark hero section */}
      <section style={{ background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)", padding: "64px 24px 72px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 44, fontWeight: 700, color: "#F8FAFC", lineHeight: 1.15, margin: "0 0 16px" }}>
            The Edu Skills Marketplace
            <br />
            <span style={{ color: "#F59E0B" }}>for Claude</span>
          </h1>
          <p style={{ fontSize: 16, color: "#94A3B8", maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.6 }}>
            Browse, install, and personalize verified skills.{" "}
            <span style={{ fontWeight: 600, color: "#E2E8F0" }}>42 skills</span> across{" "}
            <span style={{ fontWeight: 600, color: "#E2E8F0" }}>8 categories</span>.
          </p>

          {/* Terminal-style search */}
          <div style={{ maxWidth: 520, margin: "0 auto", background: "#1E293B", borderRadius: 10, border: "1px solid #334155", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'Fira Code', monospace", color: "#F59E0B", fontSize: 14 }}>$</span>
            <span style={{ fontFamily: "'Fira Code', monospace", color: "#64748B", fontSize: 14 }}>search &quot;curriculum design&quot;</span>
            <span style={{ marginLeft: "auto", width: 2, height: 18, background: "#F59E0B", animation: "blink 1s step-end infinite" }} />
          </div>
        </div>
      </section>

      {/* Warm body section */}
      <div style={{ background: "#FFFBF5" }}>
        {/* How it works */}
        <section style={{ maxWidth: 780, margin: "0 auto", padding: "56px 24px 48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { step: "1", title: "Browse", desc: "Find verified skills across education categories." },
              { step: "2", title: "Install", desc: "One-click install for Claude Desktop, Code, or projects." },
              { step: "3", title: "Add Context", desc: "Upload docs — AI generates personalized context." },
            ].map((item) => (
              <div key={item.step} style={{ textAlign: "center", padding: 24, borderRadius: 12, background: "#FFF7ED", border: "1px solid #FDE8D0" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#F59E0B", color: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 14, fontWeight: 700 }}>{item.step}</div>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, margin: "0 0 6px", fontSize: 15 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: "#78716C", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Skill cards */}
        <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 48px" }}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#1C1917" }}>Featured Skills</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {SAMPLE_SKILLS.map((s, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #F0E6D9", cursor: "pointer" }}>
                {/* Amber accent bar */}
                <div style={{ height: 3, background: "linear-gradient(to right, #F59E0B, #D97706)" }} />
                <div style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "#FEF3C7", color: "#92400E", fontFamily: "'Fira Code', monospace" }}>{s.category}</span>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: s.badge === "Expert Verified" ? "#DCFCE7" : s.badge === "Bot Verified" ? "#DBEAFE" : "#F3F4F6", color: s.badge === "Expert Verified" ? "#166534" : s.badge === "Bot Verified" ? "#1E40AF" : "#374151" }}>{s.badge}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontFamily: "'Poppins', sans-serif", fontWeight: 600, margin: "0 0 4px" }}>{s.name}</h3>
                  <p style={{ fontSize: 13, color: "#78716C", margin: "0 0 16px" }}>by {s.author}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#A8A29E" }}>{s.installs} installs</span>
                    <button style={{ background: "#F59E0B", color: "#0F172A", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Install</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: "#0F172A", padding: "48px 24px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 700, color: "#F8FAFC", marginBottom: 8 }}>Have a skill to share?</h2>
          <p style={{ color: "#94A3B8", marginBottom: 20, fontSize: 14 }}>Submit your Claude skill to the marketplace.</p>
          <button style={{ background: "#F59E0B", color: "#0F172A", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Submit a Skill</button>
        </section>

        {/* Color palette */}
        <section style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
          <h3 style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: "#A8A29E", marginBottom: 12 }}>{"// color palette"}</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { color: "#0F172A", label: "Dark Nav/Hero" },
              { color: "#1E293B", label: "Dark Surface" },
              { color: "#FFFBF5", label: "Warm Body" },
              { color: "#FFF7ED", label: "Warm Surface" },
              { color: "#F59E0B", label: "Amber CTA" },
              { color: "#D97706", label: "Amber Dark" },
              { color: "#94A3B8", label: "Muted" },
            ].map((c) => (
              <div key={c.label} style={{ textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, background: c.color, border: "1px solid #E8E4DD" }} />
                <span style={{ fontSize: 10, color: "#A8A29E", fontFamily: "'Fira Code', monospace", display: "block", marginTop: 4 }}>{c.label}</span>
                <span style={{ fontSize: 9, color: "#bbb", fontFamily: "'Fira Code', monospace" }}>{c.color}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Main Preview Page — Tab switcher
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const CONCEPTS = [
  { id: "1", label: "The Academic Terminal", sub: "Full CLI aesthetic + warm education" },
  { id: "2", label: "Warm Scholar", sub: "Clean marketplace + subtle code accents" },
  { id: "3", label: "Code Campus", sub: "Dark hero → warm cream marketplace" },
] as const;

export default function PreviewPage() {
  const [active, setActive] = useState<string>("1");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Concept selector bar */}
      <div className="sticky top-14 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-xs font-mono text-gray-400 mr-2 hidden sm:inline">DESIGN PREVIEW</span>
          {CONCEPTS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                active === c.id
                  ? "bg-gray-900 text-white shadow"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className="font-semibold">{c.id}.</span> {c.label}
            </button>
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-2">
          <p className="text-xs text-gray-400">
            {CONCEPTS.find((c) => c.id === active)?.sub}
          </p>
        </div>
      </div>

      {/* Concept render area */}
      <div className="max-w-6xl mx-auto my-6 rounded-xl overflow-hidden shadow-2xl border border-gray-300">
        {active === "1" && <Concept1 />}
        {active === "2" && <Concept2 />}
        {active === "3" && <Concept3 />}
      </div>
    </div>
  );
}

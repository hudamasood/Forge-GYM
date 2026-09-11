import { ImageResponse } from "next/og";

export const alt = "FORGE — Strength is made, not born.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social card for every page that doesn't define its own. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(70% 90% at 85% 0%, rgba(221,90,34,0.55), rgba(28,27,25,1) 60%)",
          backgroundColor: "#1c1b19",
          color: "#faf8f4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, background: "#dd5a22", display: "flex" }} />
          <div style={{ fontSize: 44, letterSpacing: 10, fontWeight: 700 }}>FORGE</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 0.95, textTransform: "uppercase" }}>Strength is made,</div>
          <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 0.95, textTransform: "uppercase", color: "#dd5a22" }}>not born.</div>
        </div>
        <div style={{ fontSize: 30, color: "#cfc7b8" }}>Six training spaces · Object-based memberships · Expert coaches</div>
      </div>
    ),
    size,
  );
}

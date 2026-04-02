import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo/site";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #111827 0%, #1f2937 60%, #f97316 100%)",
          color: "white",
          padding: "56px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>
          Explosion-Proof Electrical Solutions
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05 }}>
            {SITE_NAME}
          </div>
          <div style={{ fontSize: 34, opacity: 0.95 }}>
            Flameproof Junction Boxes, Panels, Well Glass & Hazardous Area Fittings
          </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.9 }}>Vapi, Gujarat, India</div>
      </div>
    ),
    {
      ...size,
    },
  );
}

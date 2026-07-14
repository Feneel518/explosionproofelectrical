import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo/site";

export const size = {
  width: 1200,
  height: 675,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(120deg, #0f172a 0%, #1e293b 70%, #ea580c 100%)",
          color: "white",
          padding: "56px",
          fontFamily: "Arial, sans-serif",
          gap: 18,
        }}
      >
        <div style={{ fontSize: 62, fontWeight: 800, lineHeight: 1.1 }}>
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 34, opacity: 0.95 }}>
          Flameproof and Explosion-Proof Electrical Manufacturer
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

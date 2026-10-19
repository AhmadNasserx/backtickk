import { ImageResponse } from "next/og";

// Shared social card. Colours mirror app/globals.css; the glyph mirrors GLYPH_PATH in components/ui/logo.tsx.
export const alt = "Backtickk. Join developer communities and publish technical posts.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingLeft: 80,
          paddingRight: 80,
          background: "#0a0a0b",
          color: "#f3f2ee",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
        >
          <div
            style={{
              width: 136,
              height: 136,
              borderRadius: 36,
              background: "#c8ff3d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width={84}
              height={84}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0a0a0b"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 9.25 9.5 14.75" />
            </svg>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                fontSize: 168,
                fontWeight: 400,
                letterSpacing: -6,
                lineHeight: 1,
                color: "#f3f2ee",
              }}
            >
              backtickk
            </div>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                background: "#c8ff3d",
                marginLeft: 6,
                marginBottom: 30,
              }}
            />
          </div>
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 38,
            lineHeight: 1.3,
            color: "#a3a3ab",
          }}
        >
          Join developer communities. Publish technical posts.
        </div>
      </div>
    ),
    { ...size }
  );
}

import React from "react";
import { severityColor } from "../lib/logic";

// A circular "official stamp" seal — used to render severity and status in a
// way that echoes the municipal-document motif running through the app.
export default function Seal({ severity, size = 56, label }) {
  const color = severityColor(severity);
  const dim = size;
  return (
    <div
      className="relative flex items-center justify-center rounded-full shrink-0"
      style={{ width: dim, height: dim }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `repeating-conic-gradient(${color} 0deg 3deg, transparent 3deg 12deg)`,
          opacity: 0.9,
        }}
      />
      <div
        className="absolute rounded-full bg-paper flex items-center justify-center font-display font-semibold"
        style={{ inset: dim * 0.14, color }}
      >
        <span style={{ fontSize: dim * 0.32 }}>{label ?? severity}</span>
      </div>
    </div>
  );
}

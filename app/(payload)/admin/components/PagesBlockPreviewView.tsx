"use client";

import React from "react";
import { useDocumentInfo } from "@payloadcms/ui";

/**
 * Custom Payload CMS edit view tab that renders the marketing page
 * in an iframe so it gets all proper CSS, fonts, and theme variables.
 */
export default function PagesBlockPreviewView() {
  const { initialData } = useDocumentInfo();

  const slug = (initialData as Record<string, string>)?.slug;
  const title = (initialData as Record<string, string>)?.title ?? "Untitled";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layout = (initialData as any)?.layout;
  const blockCount = Array.isArray(layout) ? layout.length : 0;

  if (!slug || blockCount === 0) {
    return (
      <div
        style={{
          padding: "4rem 2rem",
          textAlign: "center",
          color: "#666",
          fontFamily: "sans-serif",
        }}
      >
        <h2 style={{ marginBottom: "0.5rem" }}>No blocks to preview</h2>
        <p>Add blocks in the editor tab to see a live preview here.</p>
      </div>
    );
  }

  const previewUrl = slug === "home" ? "/" : `/${slug}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div
        style={{
          padding: "0.75rem 1.5rem",
          background: "#f5f5f5",
          borderBottom: "1px solid #e0e0e0",
          fontFamily: "sans-serif",
          fontSize: "12px",
          color: "#888",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span>Page Preview — {title}</span>
        <span>{blockCount} block{blockCount !== 1 ? "s" : ""}</span>
      </div>
      <iframe
        src={previewUrl}
        style={{
          flex: 1,
          width: "100%",
          border: "none",
        }}
        title={`Preview: ${title}`}
      />
    </div>
  );
}

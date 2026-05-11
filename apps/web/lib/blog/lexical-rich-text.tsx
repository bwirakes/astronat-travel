import React from "react";

/**
 * Server-rendered subset of Payload Lexical JSON (paragraph, heading, quote,
 * list, link, text). Keeps blog prose wrapper styling in the parent.
 */
function LexicalChildren({ nodes }: { nodes: unknown[] }) {
  return nodes.map((node, i) => <LexicalNode key={i} node={node} />);
}

function LexicalNode({ node }: { node: unknown }) {
  if (node === null || node === undefined) return null;
  if (typeof node !== "object") return null;

  const n = node as Record<string, unknown>;
  const type = typeof n.type === "string" ? n.type : "";

  if (type === "text") {
    const text = typeof n.text === "string" ? n.text : "";
    const format = typeof n.format === "number" ? n.format : 0;
    let out: React.ReactNode = text;
    if (format & 8) out = <s>{out}</s>;
    if (format & 4) out = <u>{out}</u>;
    if (format & 16) out = <code className="font-mono text-sm">{out}</code>;
    if (format & 2) out = <em>{out}</em>;
    if (format & 1) out = <strong>{out}</strong>;
    return <>{out}</>;
  }

  if (type === "linebreak") {
    return <br />;
  }

  if (type === "link") {
    const fields = n.fields as Record<string, unknown> | undefined;
    const url = typeof fields?.url === "string" ? fields.url : "#";
    const newTab = fields?.newTab === true;
    const children = Array.isArray(n.children) ? n.children : [];
    return (
      <a
        href={url}
        rel={newTab ? "noopener noreferrer" : undefined}
        target={newTab ? "_blank" : undefined}
        className="text-[var(--color-y2k-blue)] underline underline-offset-4 hover:opacity-80"
      >
        <LexicalChildren nodes={children} />
      </a>
    );
  }

  if (type === "paragraph") {
    const children = Array.isArray(n.children) ? n.children : [];
    return (
      <p>
        <LexicalChildren nodes={children} />
      </p>
    );
  }

  if (type === "heading") {
    const tag = typeof n.tag === "string" ? n.tag : "h2";
    const children = Array.isArray(n.children) ? n.children : [];
    const inner = <LexicalChildren nodes={children} />;
    if (tag === "h3") return <h3>{inner}</h3>;
    if (tag === "h4") return <h4>{inner}</h4>;
    return <h2>{inner}</h2>;
  }

  if (type === "quote") {
    const children = Array.isArray(n.children) ? n.children : [];
    return (
      <blockquote>
        <LexicalChildren nodes={children} />
      </blockquote>
    );
  }

  if (type === "list") {
    const listType = n.listType === "number" ? "number" : "bullet";
    const children = Array.isArray(n.children) ? n.children : [];
    const ListTag = listType === "number" ? "ol" : "ul";
    return <ListTag><LexicalChildren nodes={children} /></ListTag>;
  }

  if (type === "listitem") {
    const children = Array.isArray(n.children) ? n.children : [];
    return (
      <li>
        <LexicalChildren nodes={children} />
      </li>
    );
  }

  if (type === "horizontalrule") {
    return <hr />;
  }

  return null;
}

export function LexicalRichText({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") return null;
  const doc = data as { root?: { children?: unknown[] } };
  const children = doc.root?.children;
  if (!Array.isArray(children)) return null;
  return (
    <>
      <LexicalChildren nodes={children} />
    </>
  );
}

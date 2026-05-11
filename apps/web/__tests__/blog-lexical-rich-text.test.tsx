import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LexicalRichText } from "@/lib/blog/lexical-rich-text";

describe("LexicalRichText", () => {
  it("renders the exported Payload Lexical subset without a client boundary", () => {
    const html = renderToStaticMarkup(
      <LexicalRichText
        data={{
          root: {
            children: [
              {
                type: "heading",
                tag: "h2",
                children: [{ type: "text", text: "Mapped Heading" }],
              },
              {
                type: "paragraph",
                children: [
                  { type: "text", text: "Plain " },
                  { type: "text", text: "bold", format: 1 },
                  { type: "text", text: " and " },
                  { type: "text", text: "italic", format: 2 },
                ],
              },
              {
                type: "list",
                listType: "bullet",
                children: [
                  {
                    type: "listitem",
                    children: [{ type: "text", text: "First item" }],
                  },
                ],
              },
              {
                type: "quote",
                children: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        type: "link",
                        fields: { url: "https://astronat.com/app", newTab: true },
                        children: [{ type: "text", text: "Read the map" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        }}
      />,
    );

    expect(html).toContain("<h2>Mapped Heading</h2>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<ul><li>First item</li></ul>");
    expect(html).toContain('href="https://astronat.com/app"');
    expect(html).toContain('target="_blank"');
  });
});

import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "p", "h2", "h3", "h4", "strong", "em", "u", "s", "code", "pre",
  "blockquote", "ul", "ol", "li", "hr", "br", "a", "mark", "table",
  "thead", "tbody", "tr", "th", "td", "div",
];

export function sanitizeBlogContent(content: string) {
  return sanitizeHtml(content, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      code: ["class"],
      table: ["class"],
      div: ["class"],
      p: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      th: ["style", "colspan", "rowspan"],
      td: ["style", "colspan", "rowspan"],
    },
    allowedClasses: {
      code: ["language-*"],
      table: ["editor-table"],
      div: ["tableWrapper"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href"],
    allowProtocolRelative: false,
    allowedStyles: {
      "*": { "text-align": [/^(?:left|center|right|justify)$/] },
    },
    transformTags: {
      a: (_tagName, attributes) => {
        const external = /^https?:\/\//i.test(attributes.href ?? "");
        return {
          tagName: "a",
          attribs: {
            href: attributes.href,
            ...(external && attributes.target === "_blank"
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {}),
          },
        };
      },
    },
  });
}

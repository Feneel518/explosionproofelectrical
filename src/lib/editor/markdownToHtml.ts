const BLOCK_MARKDOWN = /(^|\n)\s{0,3}(#{1,6}\s+|>\s?|[-+*]\s+|\d+[.)]\s+|```|~~~|(?:-{3,}|\*{3,}|_{3,})\s*$|\|.+\|)/m;
const INLINE_MARKDOWN = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|==[^=]+==)/;

export function looksLikeMarkdown(value: string) {
  const text = value.replace(/\r\n?/g, "\n").trim();
  return text.length > 0 && (BLOCK_MARKDOWN.test(text) || INLINE_MARKDOWN.test(text));
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];

  for (let index = 0; index < lines.length;) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      index += 1;
      continue;
    }

    const fence = /^\s*(```|~~~)\s*([\w+-]*)\s*$/.exec(rawLine);
    if (fence) {
      const code: string[] = [];
      const closingFence = new RegExp(`^\\s*${escapeRegex(fence[1])}\\s*$`);
      index += 1;
      while (index < lines.length && !closingFence.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      const language = fence[2] ? ` class="language-${escapeAttribute(fence[2])}"` : "";
      html.push(`<pre><code${language}>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(rawLine);
    if (heading) {
      const level = Math.min(4, Math.max(2, heading[1].length));
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(rawLine)) {
      html.push("<hr>");
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const headers = splitTableRow(lines[index]);
      const alignments = splitTableRow(lines[index + 1]).map(tableAlignment);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().includes("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      html.push(
        `<table><thead><tr>${headers.map((cell, cellIndex) => `<th${alignmentStyle(alignments[cellIndex])}>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead>` +
        `<tbody>${rows.map((row) => `<tr>${headers.map((_, cellIndex) => `<td${alignmentStyle(alignments[cellIndex])}>${inlineMarkdown(row[cellIndex] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table>`,
      );
      continue;
    }

    if (/^\s{0,3}>/.test(rawLine)) {
      const quoted: string[] = [];
      while (index < lines.length && /^\s{0,3}>/.test(lines[index])) {
        quoted.push(lines[index].replace(/^\s{0,3}>\s?/, ""));
        index += 1;
      }
      html.push(`<blockquote>${markdownToHtml(quoted.join("\n"))}</blockquote>`);
      continue;
    }

    const listMatch = /^\s{0,3}([-+*]|\d+[.)])\s+(.+)$/.exec(rawLine);
    if (listMatch) {
      const ordered = /^\d/.test(listMatch[1]);
      const items: string[] = [];
      const listPattern = ordered
        ? /^\s{0,3}\d+[.)]\s+(.+)$/
        : /^\s{0,3}[-+*]\s+(.+)$/;

      while (index < lines.length) {
        const item = listPattern.exec(lines[index]);
        if (!item) break;
        const task = /^\[([ xX])\]\s+(.+)$/.exec(item[1]);
        items.push(task
          ? `<li>${task[1].toLowerCase() === "x" ? "☑" : "☐"} ${inlineMarkdown(task[2])}</li>`
          : `<li>${inlineMarkdown(item[1])}</li>`);
        index += 1;
      }

      const tag = ordered ? "ol" : "ul";
      html.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !startsBlock(lines, index)) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
  }

  return html.join("");
}

export function normalizeEditorLink(value: string) {
  const href = value.trim();
  if (!href) return null;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(href) || href.startsWith("/") || href.startsWith("#")) return href;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(href)) return `mailto:${href}`;
  if (/^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#].*)?$/i.test(href)) return `https://${href.replace(/^www\./i, "www.")}`;
  return null;
}

function startsBlock(lines: string[], index: number) {
  const line = lines[index];
  return /^\s{0,3}(?:#{1,6}\s+|>|[-+*]\s+|\d+[.)]\s+|```|~~~|(?:-{3,}|\*{3,}|_{3,})\s*$)/.test(line) || isTableStart(lines, index);
}

function inlineMarkdown(value: string) {
  const tokens: string[] = [];
  const hold = (html: string) => {
    const token = `@@MDTOKEN${tokens.length}@@`;
    tokens.push(html);
    return token;
  };

  let text = value;
  text = text.replace(/`([^`]+)`/g, (_, code: string) => hold(`<code>${escapeHtml(code)}</code>`));
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g, (_, label: string, url: string) => {
    const href = normalizeEditorLink(url);
    return href ? hold(`<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">Image: ${escapeHtml(label || "link")}</a>`) : escapeHtml(label);
  });
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g, (_, label: string, url: string) => {
    const href = normalizeEditorLink(url);
    if (!href) return escapeHtml(label);
    const external = /^https?:\/\//i.test(href);
    return hold(`<a href="${escapeAttribute(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${formatMarks(escapeHtml(label))}</a>`);
  });
  text = text.replace(/<((?:https?:\/\/|mailto:)[^>]+)>/gi, (_, url: string) => {
    const href = normalizeEditorLink(url);
    return href ? hold(`<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`) : escapeHtml(url);
  });

  text = formatMarks(escapeHtml(text));
  return text.replace(/@@MDTOKEN(\d+)@@/g, (_, tokenIndex: string) => tokens[Number(tokenIndex)] ?? "");
}

function formatMarks(value: string) {
  return value
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")
    .replace(/==([^=]+)==/g, "<mark>$1</mark>")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/(^|[^_])_([^_]+)_(?!_)/g, "$1<em>$2</em>");
}

function isTableStart(lines: string[], index: number) {
  if (index + 1 >= lines.length || !lines[index].includes("|")) return false;
  const divider = splitTableRow(lines[index + 1]);
  return divider.length > 0 && divider.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function splitTableRow(line: string) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let current = "";
  let escaped = false;
  for (const character of trimmed) {
    if (escaped) {
      current += character;
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  cells.push(current.trim());
  return cells;
}

function tableAlignment(value: string): "left" | "center" | "right" | undefined {
  if (/^:-+:$/.test(value)) return "center";
  if (/^-+:$/.test(value)) return "right";
  if (/^:-+$/.test(value)) return "left";
  return undefined;
}

function alignmentStyle(alignment?: string) {
  return alignment ? ` style="text-align: ${alignment}"` : "";
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

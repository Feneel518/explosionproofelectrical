export type EmailInfoRow = {
  label: string;
  value: string;
};

export function escapeEmailHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderEmailInfoTable(rows: EmailInfoRow[]) {
  if (!rows.length) return "";

  const content = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 12px;border:1px solid #d7e0ea;background:#f5f8fb;color:#1a3c5a;font-weight:600;width:38%;">${escapeEmailHtml(row.label)}</td>
          <td style="padding:10px 12px;border:1px solid #d7e0ea;color:#12263a;">${escapeEmailHtml(row.value)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
      <tbody>${content}</tbody>
    </table>
  `;
}

export function renderThemedEmailLayout({
  title,
  preheader,
  bodyHtml,
}: {
  title: string;
  preheader?: string;
  bodyHtml: string;
}) {
  const safeTitle = escapeEmailHtml(title);
  const safePreheader = preheader ? escapeEmailHtml(preheader) : "";

  return `
    <div style="display:none;opacity:0;max-height:0;overflow:hidden;">${safePreheader}</div>
    <div style="margin:0;padding:24px 12px;background:#eef3f8;font-family:Segoe UI,Arial,sans-serif;">
      <div style="max-width:720px;margin:0 auto;border:1px solid #d7e0ea;border-radius:12px;background:#ffffff;overflow:hidden;">
        <div style="padding:20px 24px;background:linear-gradient(135deg,#0c2f4d 0%,#164d78 55%,#1f6ea5 100%);">
          <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#cbe5ff;font-weight:600;">Explosion Proof Electrical Control</div>
          <div style="margin-top:8px;font-size:24px;line-height:1.25;color:#ffffff;font-weight:700;">${safeTitle}</div>
        </div>
        <div style="padding:24px;color:#1f2937;">
          ${bodyHtml}
        </div>
        <div style="padding:16px 24px;border-top:1px solid #e7edf3;background:#fbfdff;color:#475569;font-size:12px;line-height:1.6;">
          <div style="font-weight:600;color:#1f3d5b;">Explosion Proof Electrical Control</div>
          <div>Plot no. 920, GIDC, phase 4, Vapi, Gujarat, India</div>
          <div>GSTIN: 24AAAFE7591G1ZG</div>
        </div>
      </div>
    </div>
  `;
}

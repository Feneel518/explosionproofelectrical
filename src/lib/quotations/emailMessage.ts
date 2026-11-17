export function defaultQuotationMessage(quotationNumber: string) {
  return `Greetings,\n\nThank you for your interest in our products.\n\nFurther to your inquiry, please find attached our quotation ${quotationNumber} for your review. We would be pleased to assist you with your requirements.\n\nShould you have any questions or require further information, please do not hesitate to contact us.\n\nThank you for your time and consideration. We look forward to hearing from you.\n\nBest regards,\n\nExplosion Proof Electrical Control\nAshok Patel & Ajit Patel\nPlot No. 920, Phase 4,\nOpp. R.R. Chemical, GIDC, Vapi\nVapi - 396195, Gujarat, India\n+91 9824418868\n+91 9099064667\nwww.explosionproofelectrical.com`;
}

function escape(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

/** User edits remain plain text; only escaped text and known signature links become HTML. */
export function quotationMessageHtml(message: string) {
  const marker = "Explosion Proof Electrical Control\n";
  const position = message.indexOf(marker);
  const body = position < 0 ? message : message.slice(0, position).trim();
  const paragraphs = body.split(/\n\s*\n/).map((paragraph) => `<p style="margin:0 0 16px">${escape(paragraph).replaceAll("\n", "<br>")}</p>`).join("");
  const signature = position < 0 ? "" : `<div style="border-top:2px solid #e86b13;padding-top:16px;margin-top:24px">${message.slice(position).split("\n").map((line, index) => {
    const safe = escape(line);
    if (index === 0) return `<div style="font-size:18px;font-weight:700;color:#082b3b;margin-bottom:6px">${safe}</div>`;
    if (index === 1) return `<div style="font-weight:600;margin-bottom:10px">${safe}</div>`;
    if (line === "www.explosionproofelectrical.com") return `<div style="margin-top:8px"><a href="https://www.explosionproofelectrical.com/" style="color:#125778">${safe}</a></div>`;
    if (/^\+91 [0-9]{10}$/.test(line)) return `<div><a href="tel:${line.replaceAll(" ", "")}" style="color:#17252d;text-decoration:none">${safe}</a></div>`;
    return `<div>${safe}</div>`;
  }).join("")}</div>`;
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#17252d;max-width:640px">${paragraphs}${signature}</div>`;
}

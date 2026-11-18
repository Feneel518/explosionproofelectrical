export type FollowupChoice = "none" | "1" | "3" | "7" | "custom";

export function istDateInput(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function sendFollowupDate(choice: FollowupChoice, customDate = "", now = new Date()) {
  if (choice === "none") return null;
  let day = customDate;
  if (choice !== "custom") {
    const date = new Date(`${istDateInput(now)}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + Number(choice));
    day = date.toISOString().slice(0, 10);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error("Choose a follow-up date.");
  const date = new Date(`${day}T10:00:00+05:30`);
  if (!Number.isFinite(date.getTime()) || istDateInput(date) !== day || date <= now) throw new Error("Choose a future follow-up date.");
  return date.toISOString();
}

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export function fail(message: string): ActionResult {
  return { ok: false, message };
}

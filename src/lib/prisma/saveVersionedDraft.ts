// Catch a compare-and-swap miss, without turning other database failures into conflicts.
export async function saveVersionedDraft<T extends { draftVersion: number; updatedAt: Date }>(
  operation: () => Promise<T>,
  getCurrent: () => Promise<{ draftVersion: number } | null>,
) {
  try {
    const updated = await operation();
    return { ok: true as const, serverVersion: updated.draftVersion, savedAt: updated.updatedAt.toISOString() };
  } catch (error) {
    if ((error as { code?: string }).code !== "P2025") throw error;
    const current = await getCurrent();
    return { ok: false as const, code: "VERSION_CONFLICT" as const, serverVersion: current?.draftVersion ?? 0 };
  }
}

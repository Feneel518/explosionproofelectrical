import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./auth";

// Share one lookup between layouts and pages in the same server render.
// React's cache is request-scoped, so sessions are never shared across users.
export const getAuthSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

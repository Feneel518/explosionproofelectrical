import { auth } from "@/lib/auth/auth";
import { handleAuthRequest } from "@/lib/auth/service-availability";
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth);

export const POST = (request: Request) => handleAuthRequest(request, handlers.POST);
export const GET = (request: Request) => handleAuthRequest(request, handlers.GET);

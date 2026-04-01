import { createRouteHandler } from "uploadthing/next";
import { fileRouter } from "@/lib/uploadthing/core";

export const { GET, POST } = createRouteHandler({
  router: fileRouter,
});

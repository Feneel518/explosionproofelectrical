import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { auth } from "../auth/auth";

const f = createUploadthing();

export const utapi = new UTApi();

// ✅ If you have auth, validate user here.
// For now: allow uploads for dashboard use.
const middleware = async ({ req }: { req: Request }) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) throw new UploadThingError("Unauthorized");
    return { userId: session.user.id };
  } catch (e) {
    console.error("UploadThing middleware error:", e);
    throw new UploadThingError("Unauthorized");
  }
};

export const fileRouter = {
  productImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 10 },
  }).onUploadComplete(async ({ file }) => {
    return { url: file.url, name: file.name };
  }),

  productDrawing: f({
    image: { maxFileSize: "4MB", maxFileCount: 10 },
    pdf: { maxFileSize: "4MB", maxFileCount: 10 },
  }).onUploadComplete(async ({ file }) => {
    return { url: file.url, name: file.name };
  }),

  // Gallery (multiple images)
  galleryImages: f({ image: { maxFileSize: "4MB", maxFileCount: 12 } })
    .middleware(middleware)
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, name: file.name, key: file.key };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { createRouteHandler } from "uploadthing/next";

const f = createUploadthing();

// If you have auth, replace with actual userId
const getUserId = () => "admin";

export const ourFileRouter = {
  blogImage: f({ image: { maxFileSize: "8MB" } })
    .middleware(async () => {
      const userId = getUserId();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Return the URL so the client can store it with the blog
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

export const { GET, POST } = createRouteHandler({ router: ourFileRouter }); 
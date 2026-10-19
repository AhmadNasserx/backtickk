import type { MetadataRoute } from "next";

// Private, per-user, and API routes stay out of search indexes.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/settings", "/create", "/bookmarks"],
    },
  };
}

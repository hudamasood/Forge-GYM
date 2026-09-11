import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Spec C1: allow public routes; keep portals, cart/checkout and the API out of the index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/trainer", "/admin", "/cart", "/checkout", "/api/", "/dev-checkout", "/login", "/signup", "/forgot", "/reset-password", "/verify", "/continue"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

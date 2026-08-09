import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/contenido";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITIO}/sitemap.xml`,
  };
}

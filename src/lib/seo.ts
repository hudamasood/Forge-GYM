import type { Metadata } from "next";
import { GYM, SITE_URL } from "@/lib/site";

/**
 * Metadata builder (spec C2): unique title "{Item} | FORGE {Category}",
 * description under ~155 chars, self-referencing canonical, OG/Twitter.
 */
export function buildMetadata({
  title,
  category,
  description,
  path,
  noindex = false,
}: {
  title: string;
  category?: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  const fullTitle = category ? `${title} | FORGE ${category}` : title.includes("FORGE") ? title : `${title} | FORGE`;
  const trimmed = description.length > 155 ? `${description.slice(0, 152).trimEnd()}…` : description;
  const url = `${SITE_URL}${path}`;
  return {
    title: fullTitle,
    description: trimmed,
    alternates: { canonical: url },
    openGraph: { title: fullTitle, description: trimmed, url, siteName: GYM.name, type: "website", locale: "en_US" },
    twitter: { card: "summary_large_image", title: fullTitle, description: trimmed },
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path}`;
}

type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(c.path) })),
  };
}

export function healthClubJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HealthClub",
    name: GYM.name,
    legalName: GYM.legalName,
    description: GYM.description,
    url: SITE_URL,
    telephone: GYM.phone,
    email: GYM.email,
    slogan: GYM.tagline,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: GYM.address.street,
      addressLocality: GYM.address.city,
      addressRegion: GYM.address.region,
      postalCode: GYM.address.postalCode,
      addressCountry: GYM.address.country,
    },
    openingHoursSpecification: GYM.openingHoursSpecification.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
  };
}

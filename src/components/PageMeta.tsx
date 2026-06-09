import { useEffect } from "react";

const SITE_URL = "https://app.brain-bbqs.org";

interface PageMetaProps {
  title: string;
  description: string;
}

export function PageMeta({ title, description }: PageMetaProps) {
  useEffect(() => {
    const fullTitle =
      title === "Home"
        ? "BrainBBQS — Brain Behavior Quantification and Synchronization Consortium"
        : `${title} | BrainBBQS — Brain Behavior Quantification and Synchronization`;
    document.title = fullTitle;

    // Update or create meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);

    // Canonical URL (per-route)
    const canonicalHref = `${SITE_URL}${window.location.pathname}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalHref);

    // OG tags
    const ogTags: Record<string, string> = {
      "og:title": fullTitle,
      "og:description": description,
      "og:type": "website",
      "og:url": canonicalHref,
      "og:site_name": "BrainBBQS",
    };
    Object.entries(ogTags).forEach(([property, content]) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    });

    // Twitter tags
    const twitterTags: Record<string, string> = {
      "twitter:card": "summary_large_image",
      "twitter:title": fullTitle,
      "twitter:description": description,
    };
    Object.entries(twitterTags).forEach(([name, content]) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    });
  }, [title, description]);

  return null;
}

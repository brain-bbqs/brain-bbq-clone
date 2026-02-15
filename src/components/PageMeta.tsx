import { useEffect } from "react";

interface PageMetaProps {
  title: string;
  description: string;
}

export function PageMeta({ title, description }: PageMetaProps) {
  useEffect(() => {
    const fullTitle = title === "Home" ? "BBQS — Brain Behavior Quantification & Synchronization" : `${title} — BBQS`;
    document.title = fullTitle;

    // Update or create meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);

    // OG tags
    const ogTags: Record<string, string> = {
      "og:title": fullTitle,
      "og:description": description,
      "og:type": "website",
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
  }, [title, description]);

  return null;
}

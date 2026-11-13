import "server-only";
import sanitizeHtml from "sanitize-html";

// Article bodies come from the rich-text editor. Sanitize on save and again on
// render so nothing an editor pastes can run script on the public site.
export function sanitizeArticleHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "a",
      "ul", "ol", "li", "blockquote", "cite", "figure", "figcaption", "img", "hr", "code", "pre",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    transformTags: {
      a: (tagName, attribs) => {
        const external = /^https?:\/\//.test(attribs.href ?? "");
        return {
          tagName,
          attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : attribs,
        };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
  });
}

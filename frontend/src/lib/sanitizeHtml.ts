/**
 * Shared HTML sanitiser for rendering user/admin-authored rich-text safely.
 *
 * Uses a strict tag + attribute allow-list. Dangerous elements (script, style,
 * iframe, object, embed, form, button, input) are removed entirely.  Everything
 * else not on the allow-list is unwrapped (children kept, wrapper removed).
 *
 * The same approach is used by the legal-page renderer; this module makes it
 * available to product descriptions, CMS pages, and blog posts.
 */

const ALLOWED_TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'li',
  'ol',
  'p',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
]);

const REMOVE_WITHOUT_CONTENT = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'form',
  'button',
  'input',
  'textarea',
  'select',
]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan']),
};

function isSafeHref(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith('/') ||
    normalized.startsWith('#') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('mailto:') ||
    normalized.startsWith('tel:')
  );
}

function sanitizeElement(element: Element): void {
  const tag = element.tagName.toLowerCase();

  // Recurse children first (depth-first) so removals don't skip siblings.
  Array.from(element.children).forEach((child) => sanitizeElement(child));

  // Completely remove dangerous elements (including their children).
  if (REMOVE_WITHOUT_CONTENT.has(tag)) {
    element.remove();
    return;
  }

  // Unwrap elements not on the allow-list (keep children).
  if (!ALLOWED_TAGS.has(tag)) {
    const parent = element.parentNode;
    if (!parent) return;
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
    return;
  }

  // Strip disallowed attributes.
  Array.from(element.attributes).forEach((attr) => {
    const name = attr.name.toLowerCase();

    // Block on* event-handler attributes on every element.
    if (name.startsWith('on')) {
      element.removeAttribute(attr.name);
      return;
    }

    const allowed = ALLOWED_ATTRIBUTES[tag];
    if (!(allowed?.has(name) ?? false)) {
      element.removeAttribute(attr.name);
    }
  });

  // Validate href values (prevent javascript: and data: URIs).
  if (tag === 'a') {
    const href = element.getAttribute('href');
    if (!href || !isSafeHref(href)) {
      element.removeAttribute('href');
    }
  }

  // Validate img src values.
  if (tag === 'img') {
    const src = element.getAttribute('src');
    if (
      !src ||
      !(
        src.startsWith('/') ||
        src.startsWith('http://') ||
        src.startsWith('https://')
      )
    ) {
      element.remove();
    }
  }
}

/**
 * Sanitise an HTML string and return safe markup suitable for
 * {@link dangerouslySetInnerHTML}.
 *
 * Returns an empty string when the input is falsy or when the DOMParser API
 * is unavailable (SSR safety).
 */
export function sanitizeHtml(raw: string | null | undefined): string {
  if (!raw) return '';
  if (typeof DOMParser === 'undefined') return '';

  const doc = new DOMParser().parseFromString(raw, 'text/html');
  Array.from(doc.body.children).forEach((el) => sanitizeElement(el));
  return doc.body.innerHTML;
}

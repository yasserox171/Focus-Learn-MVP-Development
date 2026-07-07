import { Helmet } from 'react-helmet-async';

// Base URL of the server-rendered public (SEO) pages. When the backend is
// deployed, set VITE_SEO_BASE to its origin so the SPA can point canonical
// links at the crawlable server-rendered version of each page.
const SEO_BASE = (import.meta.env.VITE_SEO_BASE as string | undefined)?.replace(
  /\/+$/,
  '',
);

interface SeoProps {
  title: string;
  description?: string;
  /** Path of the canonical server-rendered page, e.g. `/lesson/<slug>/`. */
  canonicalPath?: string;
  lang?: 'ar' | 'fr';
}

/** Sets per-page document metadata (title, description, canonical, Open
 * Graph). Helps Google's JS rendering and social/link previews for the app. */
export default function Seo({ title, description, canonicalPath, lang }: SeoProps) {
  const fullTitle = title.includes('Focus Learn') ? title : `${title} | Focus Learn`;
  const canonical =
    canonicalPath && SEO_BASE ? `${SEO_BASE}${canonicalPath}` : undefined;
  return (
    <Helmet>
      <html lang={lang ?? 'ar'} />
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:site_name" content="Focus Learn" />
      <meta name="twitter:card" content="summary" />
    </Helmet>
  );
}

/** Strips inline `$...$` math and truncates for meta descriptions. */
export function toDescription(text: string, limit = 160): string {
  const clean = text.replace(/\$([^$]*)\$/g, '$1').replace(/\s+/g, ' ').trim();
  return clean.length > limit ? clean.slice(0, limit).trimEnd() + '…' : clean;
}

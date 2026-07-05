import type { JSONContent } from '@tiptap/react';

import type { ContentBlock } from '../api/types';

/** Conversion between the agreed Lesson.content { blocks } structure and the
 * TipTap document. The API stores blocks, never raw editor HTML, so the
 * future Flutter app reads the exact same structure. */

function textOf(node: JSONContent): string {
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'inlineMath') {
    // Inline math survives as $...$ inside paragraph text
    return `$${(node.attrs?.latex as string) ?? ''}$`;
  }
  return (node.content ?? []).map(textOf).join('');
}

export function docToBlocks(doc: JSONContent): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  for (const node of doc.content ?? []) {
    switch (node.type) {
      case 'heading': {
        const text = textOf(node).trim();
        if (text) blocks.push({ type: 'heading', text });
        break;
      }
      case 'paragraph': {
        const text = textOf(node).trim();
        if (text) blocks.push({ type: 'paragraph', text });
        break;
      }
      case 'blockMath': {
        const latex = ((node.attrs?.latex as string) ?? '').trim();
        if (latex) blocks.push({ type: 'latex', text: latex });
        break;
      }
      case 'image': {
        const url = (node.attrs?.src as string) ?? '';
        if (url)
          blocks.push({
            type: 'image',
            url,
            caption: (node.attrs?.alt as string) || undefined,
          });
        break;
      }
      default:
        break;
    }
  }
  return blocks;
}

/** Splits paragraph text on $...$ so inline math round-trips into real
 * inlineMath nodes inside the editor. */
function textToInlineContent(text: string): JSONContent[] {
  const parts = text.split(/(\$[^$]+\$)/g).filter(Boolean);
  return parts.map((part) =>
    part.startsWith('$') && part.endsWith('$') && part.length > 2
      ? { type: 'inlineMath', attrs: { latex: part.slice(1, -1) } }
      : { type: 'text', text: part },
  );
}

export function blocksToDoc(blocks: ContentBlock[]): JSONContent {
  const content: JSONContent[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        content.push({
          type: 'heading',
          attrs: { level: 2 },
          content: textToInlineContent(block.text),
        });
        break;
      case 'paragraph':
        content.push({ type: 'paragraph', content: textToInlineContent(block.text) });
        break;
      case 'latex':
        content.push({ type: 'blockMath', attrs: { latex: block.text } });
        break;
      case 'image':
        content.push({
          type: 'image',
          attrs: { src: block.url, alt: block.caption ?? '' },
        });
        break;
      // video blocks are not editable in TipTap; they are preserved
      // separately by the editor page and re-appended on save
      default:
        break;
    }
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type: 'doc', content };
}

export function extractVideoBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.filter((b) => b.type === 'video');
}

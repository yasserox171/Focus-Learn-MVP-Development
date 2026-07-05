import { BlockMath } from 'react-katex';

import type { ContentBlock } from '../api/types';
import MathText from './MathText';
import YouTubeEmbed from './YouTubeEmbed';

/** Renders the agreed { blocks: [...] } lesson content structure.
 * The same JSON is consumed by the future Flutter app. */
export default function BlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="lesson-blocks">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return (
              <h2 key={i} className="block-heading">
                <MathText text={block.text} />
              </h2>
            );
          case 'paragraph':
            return (
              <p key={i} className="block-paragraph">
                <MathText text={block.text} />
              </p>
            );
          case 'latex':
            return (
              <div key={i} className="block-latex">
                <BlockMath math={block.text} />
              </div>
            );
          case 'image':
            return (
              <figure key={i} className="block-image">
                <img src={block.url} alt={block.caption ?? ''} loading="lazy" />
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            );
          case 'video':
            return <YouTubeEmbed key={i} url={block.url} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

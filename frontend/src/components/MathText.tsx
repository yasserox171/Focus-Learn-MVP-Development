import { Fragment } from 'react';
import { InlineMath } from 'react-katex';

/** Renders text that may contain inline $...$ LaTeX segments. */
export default function MathText({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('$') && part.endsWith('$') && part.length > 2 ? (
          <InlineMath key={i} math={part.slice(1, -1)} />
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

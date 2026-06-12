import React from 'react';

// Editorial section delimiter — eyebrow caps + hairline rule.
// Repeated motif across pages; one of the brand signatures.
//
// Usage:
//   <SectionRule eyebrow="Citations" />
//   <SectionRule eyebrow="Score breakdown" action={<Button …/>} />
export default function SectionRule({ eyebrow, action, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {eyebrow ? <span className="eyebrow flex-shrink-0">{eyebrow}</span> : null}
      <hr className="section-rule flex-1 m-0" />
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

// Smooth count-up animation triggered when the element enters the viewport.
// Used by the by-the-numbers strip on the landing page.
//
// API: `const { ref, displayValue } = useCountUp(6655, { duration: 1100 });`
// Pass the formatted value through `format` if you need locale separators
// or special characters (e.g. "110/110").
export default function useCountUp(target, { duration = 1000, format } = {}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || startedRef.current) return;

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      // Respect reduced-motion users — skip the animation entirely.
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        setValue(target);
        return;
      }
      const startTs = performance.now();
      const tick = (now) => {
        const elapsed = now - startTs;
        const t = Math.min(elapsed / duration, 1);
        // ease-out cubic — feels natural, decelerates into final value
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
        else setValue(target);
      };
      requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === 'undefined') {
      start();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            start();
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [target, duration]);

  const displayValue = format ? format(value) : value.toLocaleString();
  return { ref, displayValue };
}

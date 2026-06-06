import { useEffect, useRef, useCallback } from 'react';

/**
 * CustomCursor — dot + trailing ring cursor that enlarges on hoverable elements.
 * Managed entirely via refs & RAF for zero re-render cost.
 */
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const ring = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const rafId = useRef(null);

  const lerp = useCallback((a, b, t) => a + (b - a) * t, []);

  useEffect(() => {
    const dot = dotRef.current;
    const ringEl = ringRef.current;
    if (!dot || !ringEl) return;

    const onMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
    };

    const loop = () => {
      ring.current.x = lerp(ring.current.x, mouse.current.x, 0.13);
      ring.current.y = lerp(ring.current.y, mouse.current.y, 0.13);
      ringEl.style.left = `${ring.current.x}px`;
      ringEl.style.top = `${ring.current.y}px`;
      rafId.current = requestAnimationFrame(loop);
    };

    document.addEventListener('mousemove', onMove);
    rafId.current = requestAnimationFrame(loop);

    /* Hover state on interactable elements */
    const selector = 'button, a, .layer-item, .metric, .stack-card, .tick-item, .feat-card, .nav-cell';
    const enter = () => {
      dot.style.width = '14px';
      dot.style.height = '14px';
      ringEl.style.width = '48px';
      ringEl.style.height = '48px';
      ringEl.style.borderColor = 'rgba(255,85,0,0.7)';
    };
    const leave = () => {
      dot.style.width = '8px';
      dot.style.height = '8px';
      ringEl.style.width = '32px';
      ringEl.style.height = '32px';
      ringEl.style.borderColor = 'rgba(255,85,0,0.45)';
    };

    const attach = () => {
      document.querySelectorAll(selector).forEach((el) => {
        el.addEventListener('mouseenter', enter);
        el.addEventListener('mouseleave', leave);
      });
    };

    /* Attach once, then re-attach after any DOM mutations (sections revealing) */
    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId.current);
      observer.disconnect();
    };
  }, [lerp]);

  return (
    <>
      <div ref={dotRef} className="cur-dot" />
      <div ref={ringRef} className="cur-ring" />
    </>
  );
}

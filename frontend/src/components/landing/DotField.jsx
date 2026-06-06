import { useEffect, useRef, useCallback } from 'react';

/**
 * DotField — Canvas-based interactive dot field background.
 * Vanilla port of ReactBits DotField with NiceTry amber/gold theming.
 *
 * Dots bulge outward from cursor with a radial glow gradient following the mouse.
 */

const TWO_PI = Math.PI * 2;

export default function DotField({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 500,
  bulgeStrength = 67,
  glowRadius = 160,
  gradientFrom = 'rgba(212, 168, 83, 0.30)',
  gradientTo = 'rgba(168, 196, 160, 0.18)',
  glowColor = '#0d0b0f',
}) {
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 });
  const rafRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
  const glowOpacity = useRef(0);
  const glowIdRef = useRef(`dot-field-glow-${Math.random().toString(36).slice(2, 9)}`);

  const buildDots = useCallback((w, h) => {
    const step = dotRadius + dotSpacing;
    const cols = Math.floor(w / step);
    const rows = Math.floor(h / step);
    const padX = (w % step) / 2;
    const padY = (h % step) / 2;
    const dots = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const ax = padX + col * step + step / 2;
        const ay = padY + row * step + step / 2;
        dots.push({ ax, ay, x: ax, y: ay, r: dotRadius, baseR: dotRadius, alpha: 1 });
      }
    }

    dotsRef.current = dots;
  }, [dotRadius, dotSpacing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let resizeTimer;

    /* ── Resize handling ── */
    function doResize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      sizeRef.current = {
        w,
        h,
        offsetX: rect.left + window.scrollX,
        offsetY: rect.top + window.scrollY,
      };

      buildDots(w, h);
    }

    function resize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 100);
    }

    /* ── Mouse tracking ── */
    function onMouseMove(e) {
      const s = sizeRef.current;
      const prevX = mouseRef.current.x;
      const prevY = mouseRef.current.y;
      mouseRef.current.x = e.pageX - s.offsetX;
      mouseRef.current.y = e.pageY - s.offsetY;
      mouseRef.current.prevX = prevX;
      mouseRef.current.prevY = prevY;

      const dx = mouseRef.current.x - prevX;
      const dy = mouseRef.current.y - prevY;
      mouseRef.current.speed = Math.sqrt(dx * dx + dy * dy);
    }

    function onMouseLeave() {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    }

    /* ── Render loop ── */
    function draw() {
      const { w, h } = sizeRef.current;
      const dots = dotsRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const isActive = mx > -9000;

      ctx.clearRect(0, 0, w, h);

      /* Glow gradient behind cursor */
      const targetGlow = isActive ? 1 : 0;
      glowOpacity.current += (targetGlow - glowOpacity.current) * 0.08;

      if (glowOpacity.current > 0.01) {
        const grd = ctx.createRadialGradient(mx, my, 0, mx, my, glowRadius);
        grd.addColorStop(0, gradientFrom);
        grd.addColorStop(1, gradientTo);
        ctx.globalAlpha = glowOpacity.current;
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(mx, my, glowRadius, 0, TWO_PI);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      /* Draw & animate dots */
      for (let i = 0, len = dots.length; i < len; i++) {
        const dot = dots[i];

        if (isActive) {
          const dx = dot.ax - mx;
          const dy = dot.ay - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < cursorRadius) {
            const force = (1 - dist / cursorRadius);
            const push = force * bulgeStrength;
            const angle = Math.atan2(dy, dx);

            dot.x = dot.ax + Math.cos(angle) * push;
            dot.y = dot.ay + Math.sin(angle) * push;
            dot.r = dot.baseR + force * 2.5;
            dot.alpha = 0.4 + force * 0.6;
          } else {
            dot.x += (dot.ax - dot.x) * 0.12;
            dot.y += (dot.ay - dot.y) * 0.12;
            dot.r += (dot.baseR - dot.r) * 0.12;
            dot.alpha += (0.35 - dot.alpha) * 0.12;
          }
        } else {
          dot.x += (dot.ax - dot.x) * 0.08;
          dot.y += (dot.ay - dot.y) * 0.08;
          dot.r += (dot.baseR - dot.r) * 0.08;
          dot.alpha += (0.35 - dot.alpha) * 0.08;
        }

        ctx.globalAlpha = dot.alpha;
        ctx.fillStyle = '#e4dff0';
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, TWO_PI);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    }

    /* ── Init ── */
    doResize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resizeTimer);
    };
  }, [buildDots, cursorRadius, bulgeStrength, glowRadius, gradientFrom, gradientTo]);

  return (
    <div className="hero-canvas-wrap">
      <canvas ref={canvasRef} />

      {/* SVG glow filter for soft dot edges */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <radialGradient id={glowIdRef.current}>
            <stop offset="0%" stopColor={glowColor} stopOpacity="0" />
            <stop offset="100%" stopColor={glowColor} stopOpacity="1" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

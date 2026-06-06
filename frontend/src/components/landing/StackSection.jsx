import { useEffect, useRef } from 'react';

/**
 * StackSection — Tech stack cards with staggered scroll-reveal.
 */
const STACK = [
  { num: '01', icon: '⚡', name: 'FastAPI', desc: 'Async Python backend with Pydantic validation, rate limiting, and request tracing.' },
  { num: '02', icon: '⚛️', name: 'React + Vite', desc: '4-page dashboard with React Flow threat graph and animated pipeline visualization.' },
  { num: '03', icon: '🧠', name: 'XGBoost', desc: 'ML classification engine with SHAP feature importance for explainable detections.' },
  { num: '04', icon: '🔌', name: 'Chrome MV3', desc: 'Real-time extension with passive monitoring, risk badges, and intervention overlay.' },
];

export default function StackSection() {
  const cardsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('vis');
        });
      },
      { threshold: 0.12 }
    );

    cardsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="landing-stack" id="stack">
      <p className="sec-label vis">Built with</p>

      <div className="stack-grid">
        {STACK.map(({ num, icon, name, desc }, i) => (
          <div
            key={name}
            className="stack-card hover-parent"
            ref={(el) => { cardsRef.current[i] = el; }}
          >
            <div className="stack-num">{num}</div>
            <div className="stack-icon">{icon}</div>
            <div className="stack-name">
              <span className="text-slide">
                <span className="ts-top">{name}</span>
                <span className="ts-bot">{name}</span>
              </span>
            </div>
            <div className="stack-desc">{desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

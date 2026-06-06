import { useEffect, useRef } from 'react';

/**
 * AboutSection — Platform about section with 7-layer analysis list.
 */
const LAYERS = [
  { num: 'L1', name: 'URL Feature Extraction', tag: 'sync', tagClass: 'tag-s' },
  { num: 'L2', name: 'ML Detection Engine', tag: 'sync', tagClass: 'tag-s' },
  { num: 'L3', name: 'Brand Similarity', tag: 'sync', tagClass: 'tag-s' },
  { num: 'L4', name: 'Visual Clone Detection', tag: 'async', tagClass: 'tag-a' },
  { num: 'L5', name: 'Threat Intelligence', tag: 'async', tagClass: 'tag-a' },
  { num: 'L6', name: 'Behavioral Analysis', tag: 'async', tagClass: 'tag-a' },
  { num: 'L7', name: 'AI Threat Investigator', tag: 'AI', tagClass: 'tag-ai' },
];

export default function AboutSection() {
  const refs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('vis');
        });
      },
      { threshold: 0.12 }
    );

    refs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="landing-about" id="about">
      <p className="sec-label vis">About the platform</p>

      <h2
        className="about-head"
        ref={(el) => { refs.current[0] = el; }}
      >
        Built for the threat<br />
        that <em>explains</em> itself.
      </h2>

      <div className="about-grid">
        <div
          className="about-l"
          ref={(el) => { refs.current[1] = el; }}
        >
          <p className="about-body">
            NiceTry is a <strong>next-generation phishing intelligence ecosystem</strong>{' '}
            that goes beyond binary safe/unsafe verdicts. It combines machine learning,
            visual analysis, and AI-powered explainability into a single real-time platform.
          </p>
          <p className="about-body">
            Every detection is paired with a <strong>human-readable narrative</strong> — so
            your team doesn&apos;t just know a site is dangerous, they understand <em>why</em>.
          </p>
          <p className="about-body">
            Built for Smart India Hackathon 2024. Deployed as a FastAPI backend,
            React dashboard, and Chrome extension.
          </p>
        </div>

        <div
          className="about-r"
          ref={(el) => { refs.current[2] = el; }}
        >
          <div className="layer-list">
            {LAYERS.map(({ num, name, tag, tagClass }) => (
              <div className="layer-item hover-parent" key={num}>
                <span className="l-num">{num}</span>
                <span className="l-name">
                  <span className="text-slide">
                    <span className="ts-top">{name}</span>
                    <span className="ts-bot">{name}</span>
                  </span>
                </span>
                <span className={`l-tag ${tagClass}`}>{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

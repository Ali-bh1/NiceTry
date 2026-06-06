import { useEffect, useRef } from 'react';

/**
 * FeaturesGrid — Hermes-style 3-column bordered grid with scroll-reveal.
 */
const FEATURES = [
  {
    title: '7-Layer Threat Analysis',
    desc: 'URL features, ML classification, brand similarity, visual clone detection, threat intel, behavioral analysis, and AI investigation — all in one pipeline.',
  },
  {
    title: 'AI-Powered Explainability',
    desc: "Every detection includes a human-readable narrative powered by SHAP feature importance — your team doesn't just know a site is dangerous, they understand why.",
  },
  {
    title: 'Real-Time Detection',
    desc: 'Sub-200ms response times with async pipeline architecture. Synchronous layers return instant verdicts while deep analysis runs in parallel.',
  },
  {
    title: 'Visual Clone Detection',
    desc: 'Screenshot-based comparison against known brand assets using perceptual hashing and structural similarity scoring to catch pixel-perfect phishing pages.',
  },
  {
    title: 'Chrome Extension',
    desc: 'Manifest V3 extension with passive URL monitoring, color-coded risk badges, and full-page intervention overlays for high-confidence threats.',
  },
  {
    title: 'Threat Intelligence Feeds',
    desc: 'Cross-references URLs against PhishTank, OpenPhish, Google Safe Browsing, and VirusTotal for comprehensive reputation scoring.',
  },
];

export default function FeaturesGrid() {
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
    <section className="landing-features" id="features">
      <div className="features-header">
        <h2>
          <span className="text-slide">
            <span className="ts-top">Features</span>
            <span className="ts-bot">Features</span>
          </span>
        </h2>
      </div>

      <div className="features-grid">
        {FEATURES.map(({ title, desc }, i) => (
          <div
            key={title}
            className="feat-card hover-parent"
            ref={(el) => { cardsRef.current[i] = el; }}
          >
            <div className="feat-title">
              <span className="text-slide">
                <span className="ts-top">{title}</span>
                <span className="ts-bot">{title}</span>
              </span>
            </div>
            <p className="feat-desc">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

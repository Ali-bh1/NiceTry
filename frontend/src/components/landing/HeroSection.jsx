import { useNavigate } from 'react-router-dom';
import FaultyTerminal from './FaultyTerminal';

/**
 * HeroSection — Main hero banner.
 *
 * Layer order (bottom → top):
 *   1. FaultyTerminal — animated glyph background (OGL shader)
 *   2. Dark radial vignette overlay for text contrast
 *   3. HTML hero text — bold, readable, #ff5500 accent
 *   4. CTA button — centered below text
 */
export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="landing-hero" id="hero">

      {/* Layer 1 — Animated terminal background */}
      <div className="terminal-bg-wrap">
        <FaultyTerminal
          scale={1.5}
          gridMul={[2, 1]}
          digitSize={1.2}
          timeScale={1}
          scanlineIntensity={1}
          glitchAmount={1}
          flickerAmount={0.6}
          noiseAmp={1}
          chromaticAberration={0}
          curvature={0}
          tint="#ff5500"
          mouseReact
          mouseStrength={0.5}
          brightness={0.6}
        />
      </div>

      {/* Layer 2 — Vignette for readability */}
      <div className="hero-overlay" />

      {/* Layer 3 — HTML hero text + CTA, all centered */}
      <div className="hero-content">

        {/* Tagline badge */}
        <div className="hero-tag">
          <span className="hero-tag-line" />
          <span>7-Layer Detection</span>
          <span className="hero-tag-ver">97% Accuracy</span>
          <span className="hero-tag-line" />
        </div>

        {/* Main headline */}
        <h1 className="hero-title">
          <span className="line"><span>The Last Line</span></span>
          <span className="line"><span>Between You And</span></span>
          <span className="line"><span className="ital">The Threat.</span></span>
        </h1>

        {/* Subheading */}
        <p className="hero-desc">
          NiceTry doesn't just flag URLs — it <strong>investigates</strong> them.<br />
          Multi-layer threat analysis in real time.
        </p>

        {/* CTA */}
        <div className="hero-cta">
          <button
            className="btn-scan"
            id="btn-scan"
            onClick={() => navigate('/scan')}
            type="button"
          >
            SCAN A URL
          </button>
        </div>

      </div>
    </section>
  );
}

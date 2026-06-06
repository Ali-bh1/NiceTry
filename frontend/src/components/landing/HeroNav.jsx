import { useEffect, useState } from 'react';

/**
 * HeroNav — Hermes-style fixed grid navigation bar.
 * All links use in-page smooth scroll.
 */
export default function HeroNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`landing-nav${scrolled ? ' scrolled' : ''}`} id="landing-nav">
      <a href="#hero" className="nav-cell nav-logo-cell" onClick={scrollTo('hero')}>
        NICETRY
      </a>

      <div className="nav-cell nav-spacer" />

      <a href="#about" className="nav-cell" onClick={scrollTo('about')}>
        <span className="text-slide">
          <span className="ts-top">About</span>
          <span className="ts-bot">About</span>
        </span>
        <span className="blink-cursor" />
      </a>

      <a href="#features" className="nav-cell" onClick={scrollTo('features')}>
        <span className="text-slide">
          <span className="ts-top">Technology</span>
          <span className="ts-bot">Technology</span>
        </span>
        <span className="blink-cursor" />
      </a>

      <a href="#stack" className="nav-cell" onClick={scrollTo('stack')}>
        <span className="text-slide">
          <span className="ts-top">Stack</span>
          <span className="ts-bot">Stack</span>
        </span>
        <span className="blink-cursor" />
      </a>

      <a href="#about-us" className="nav-cell nav-cta-cell" onClick={scrollTo('about-us')}>
        <span className="text-slide">
          <span className="ts-top">About Us</span>
          <span className="ts-bot">About Us</span>
        </span>
        <span className="blink-cursor" />
      </a>
    </nav>
  );
}

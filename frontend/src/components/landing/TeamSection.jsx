import { useEffect, useRef } from 'react';

/**
 * TeamSection — "Four builders, one mission" with member cards and social links.
 */

/* SVG icon components for social links */
function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const TEAM = [
  {
    num: '01',
    name: 'Ali Bhatkar',
    role: 'Full-Stack Architecture · Backend · Chrome Extension · Deployment',
    github: 'https://github.com/Ali-bh1',
    linkedin: 'https://linkedin.com/in/username',
  },
  {
    num: '02',
    name: 'Jignesh Parmar',
    role: 'React Dashboard · UI Design · Docker Compose · Integration',
    github: 'https://github.com/username',
    linkedin: 'https://linkedin.com/in/username',
  },
  {
    num: '03',
    name: 'Shubham Yedve',
    role: 'ML Pipeline · SHAP Explainability · SQLite Optimization · Backend Tuning',
    github: 'https://github.com/username',
    linkedin: 'https://linkedin.com/in/username',
  },
  {
    num: '04',
    name: 'Aryan Bhanage',
    role: 'Research · Testing · Documentation',
    github: 'https://github.com/username',
    linkedin: 'https://linkedin.com/in/username',
  },
];

export default function TeamSection() {
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
    <section className="landing-about" id="about-us" style={{ borderBottom: 'none' }}>
      <p className="sec-label vis">About the team</p>

      <h2
        className="about-head"
        ref={(el) => { refs.current[0] = el; }}
      >
        Four builders,<br />
        one <em>mission</em>.
      </h2>

      <div className="about-grid" style={{ marginTop: '48px' }}>
        <div
          className="about-l"
          ref={(el) => { refs.current[1] = el; }}
        >
          <p className="about-body">
            NiceTry was built by a team of four who share a deep interest in
            cybersecurity, machine learning, and building systems that don&apos;t just
            detect threats — they <em>explain</em> them.
          </p>
          <p className="about-body">
            Our team brings together <strong>full-stack engineering</strong>,{' '}
            <strong>ML/AI research</strong>, and <strong>DevOps</strong> expertise.
            We believe security tools should be both technically rigorous and
            beautifully designed — because intelligence shouldn&apos;t be inaccessible.
          </p>
          <p className="about-body">
            From backend optimizations and SHAP explainability tuning to Docker
            containerization and a polished React dashboard — every layer of
            NiceTry was built with care.
          </p>
        </div>

        <div
          className="about-r"
          ref={(el) => { refs.current[2] = el; }}
        >
          <div className="layer-list">
            {TEAM.map(({ num, name, role, github, linkedin }) => (
              <div key={num}>
                {/* Name row */}
                <div className="layer-item hover-parent">
                  <span className="l-num">{num}</span>
                  <span className="l-name">
                    <span className="text-slide">
                      <span className="ts-top">{name}</span>
                      <span className="ts-bot">{name}</span>
                    </span>
                  </span>
                  <div className="member-socials">
                    <a href={github} target="_blank" rel="noopener noreferrer" title="GitHub">
                      <GitHubIcon />
                    </a>
                    <a href={linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                      <LinkedInIcon />
                    </a>
                  </div>
                </div>
                {/* Role row */}
                <div className="layer-item hover-parent">
                  <span className="l-num" style={{ opacity: 0.5 }}>—</span>
                  <span className="l-name" style={{ fontSize: '12px', color: 'var(--landing-muted)' }}>
                    {role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

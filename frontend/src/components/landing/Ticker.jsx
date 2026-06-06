import { useEffect, useRef } from 'react';

/**
 * Ticker — infinite horizontal scroll of technology keywords.
 * Duplicates inner content for seamless loop.
 */
const ITEMS = [
  'URL Feature Extraction',
  'ML Engine · XGBoost',
  'Brand Similarity',
  'Visual Clone Detection',
  'Threat Intelligence',
  'Behavioral Analysis',
  'AI Threat Investigator',
  'Chrome Extension · MV3',
  'SSRF Prevention',
  'Rate Limiting',
];

export default function Ticker() {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    /* Duplicate content for seamless infinite scroll */
    track.innerHTML += track.innerHTML;
  }, []);

  return (
    <div className="ticker-wrap">
      <div className="ticker-track" ref={trackRef}>
        {ITEMS.map((text) => (
          <div className="tick-item" key={text}>
            <span className="td" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

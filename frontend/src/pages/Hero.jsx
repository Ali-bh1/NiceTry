import '../styles/landing.css';
import CustomCursor from '../components/landing/CustomCursor';
import HeroNav from '../components/landing/HeroNav';
import HeroSection from '../components/landing/HeroSection';
import MetricsBar from '../components/landing/MetricsBar';
import Ticker from '../components/landing/Ticker';
import FeaturesGrid from '../components/landing/FeaturesGrid';
import AboutSection from '../components/landing/AboutSection';
import StackSection from '../components/landing/StackSection';
import TeamSection from '../components/landing/TeamSection';

/**
 * Hero — Landing page composed from modular sections.
 *
 * This replaces the previous minimal white Hero page with the full
 * Hermes-style dark-themed design. All sections are self-contained
 * React components with scroll-reveal animations.
 */
export default function Hero() {
  return (
    <div className="landing-page">
      {/* Film grain overlay */}
      <div className="landing-grain" />

      {/* Custom cursor */}
      <CustomCursor />

      {/* Fixed navigation */}
      <HeroNav />

      {/* Hero banner with DotField + FluidGlass */}
      <HeroSection />

      {/* Stats strip */}
      <MetricsBar />

      {/* Technology ticker */}
      <Ticker />

      {/* Feature cards grid */}
      <FeaturesGrid />

      {/* About the platform */}
      <AboutSection />

      {/* Tech stack */}
      <StackSection />

      {/* Team section */}
      <TeamSection />
    </div>
  );
}
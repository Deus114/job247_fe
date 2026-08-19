import Hero from './components/Hero';
import FeaturedJobs from './components/FeaturedJobs';
import CategoryGrid from './components/CategoryGrid';
import CTASection from './components/CTASection';

export default function Home() {
  return (
    <div>
      <Hero />
      <CategoryGrid />
      <FeaturedJobs />
      <CTASection />
    </div>
  );
}
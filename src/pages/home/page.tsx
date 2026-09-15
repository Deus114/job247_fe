import Hero from './components/Hero';
import { FeaturedJobs, CategoryGrid } from '@/features/jobs';
import CTASection from './components/CTASection';

export default function Home() {
  return (
    <div>
      <Hero />
      <FeaturedJobs />
      <CategoryGrid />
      <CTASection />
    </div>
  );
}
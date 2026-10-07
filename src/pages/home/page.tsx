import { CategoryGrid, FeaturedJobs, LatestJobs } from "@/features/jobs";
import CTASection from "./components/CTASection";
import Hero from "./components/Hero";

export default function Home() {
  return (
    <div>
      <Hero />
      <FeaturedJobs />
      <LatestJobs />
      <CategoryGrid />
      <CTASection />
    </div>
  );
}

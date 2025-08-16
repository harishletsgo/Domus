import { Hero } from '@/components/Hero';
import { FeaturedProperties } from '@/components/FeaturedProperties';
import { Features } from '@/components/Features';
import { Stats } from '@/components/Stats';
import { HowItWorks } from '@/components/HowItWorks';
import { Testimonials } from '@/components/Testimonials';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Stats />
      <FeaturedProperties />
      <Features />
      <HowItWorks />
      <Testimonials />
    </div>
  );
}

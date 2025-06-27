import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            기술자격학습플랫폼
          </h1>
        </div>
      </div>
    </section>
  );
} 
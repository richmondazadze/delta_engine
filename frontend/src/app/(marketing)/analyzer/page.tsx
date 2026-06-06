import Link from "next/link";
import { TestimonialsSection } from "@/components/testimonials-section";
import { FeatureSection } from "@/components/feature-section";
import { CallToAction } from "@/components/cta";
import { MarketingSection } from "@/components/marketing/MarketingSection";
import { MarketingCopyGrid } from "@/components/marketing/MarketingCopyGrid";
import { ANALYZER_PAGE } from "@/lib/marketing-content";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";

export default function AnalyzerPage() {
  const { hero, problem, pillars, features, control, testimonials } = ANALYZER_PAGE;

  return (
    <main>
      <MarketingSection
        kicker={hero.kicker}
        title={hero.title}
        description={hero.description}
        className="pt-8 md:pt-12"
      >
        <div className="flex justify-center pt-2">
          <Button
            size="lg"
            className="h-12 rounded-sm px-7 text-base"
            render={<Link href="/register" />}
            nativeButton={false}
          >
            {hero.cta}
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </MarketingSection>

      <MarketingSection
        kicker={problem.kicker}
        title={problem.title}
        description={problem.description}
      >
        <MarketingCopyGrid items={pillars} columns={3} />
      </MarketingSection>

      <MarketingSection
        kicker={features.kicker}
        title={features.title}
        description={features.description}
      >
        <MarketingCopyGrid items={features.items} columns={3} />
        <div className="mt-16 md:mt-20">
          <FeatureSection />
        </div>
      </MarketingSection>

      <MarketingSection
        kicker={control.kicker}
        title={control.title}
        description={control.description}
      />

      <MarketingSection
        kicker={testimonials.kicker}
        title={testimonials.title}
        description={testimonials.description}
      >
        <TestimonialsSection />
      </MarketingSection>

      <MarketingSection className="mk-section-tight" reveal={false}>
        <CallToAction />
      </MarketingSection>
    </main>
  );
}

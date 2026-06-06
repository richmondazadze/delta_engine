import Link from "next/link";
import { FeatureSection } from "@/components/feature-section";
import { CallToAction } from "@/components/cta";
import { MarketingSection } from "@/components/marketing/MarketingSection";
import { MarketingBanner, MarketingCopyGrid } from "@/components/marketing/MarketingCopyGrid";
import { COPIER_PAGE } from "@/lib/marketing-content";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";

export default function CopierPage() {
  const { hero, strategy, pillars, benefits, technical, features } = COPIER_PAGE;

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
        kicker={strategy.kicker}
        title={strategy.title}
        description={strategy.description}
      >
        <MarketingCopyGrid items={pillars} columns={3} />
      </MarketingSection>

      <MarketingSection
        kicker={benefits.kicker}
        title={benefits.title}
        description={benefits.description}
      >
        <FeatureSection />
      </MarketingSection>

      <MarketingSection reveal={false}>
        <MarketingBanner title={technical.title} description={technical.description} />
      </MarketingSection>

      <MarketingSection kicker={features.kicker} title={features.title}>
        <MarketingCopyGrid items={features.items} columns={4} />
      </MarketingSection>

      <MarketingSection className="mk-section-tight" reveal={false}>
        <CallToAction />
      </MarketingSection>
    </main>
  );
}

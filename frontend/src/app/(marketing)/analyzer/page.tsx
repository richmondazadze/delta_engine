import { TestimonialsSection } from "@/components/testimonials-section";
import { FeatureSection } from "@/components/feature-section";
import { CallToAction } from "@/components/cta";
import { MarketingSection } from "@/components/marketing/MarketingSection";

export default function AnalyzerPage() {
  return (
    <main>
      <MarketingSection
        kicker="CopyMorphic Analyzer"
        title="Turn copied trades into portfolio intelligence"
        description="Track ROI, win rate, drawdown, and consistency per account — or see total portfolio performance at a glance. Know what is working and what is leaking risk."
        className="pt-8 md:pt-12"
      >
        <FeatureSection />
      </MarketingSection>

      <MarketingSection
        kicker="What traders say"
        title="Clarity that changes how you manage risk"
        description="Operators use Analyzer insights to refine strategy allocation and cut underperforming copy paths faster."
      >
        <TestimonialsSection />
      </MarketingSection>

      <MarketingSection className="mk-section-tight" reveal={false}>
        <CallToAction />
      </MarketingSection>
    </main>
  );
}

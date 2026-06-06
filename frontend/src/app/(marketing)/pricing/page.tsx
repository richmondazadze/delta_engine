import { PricingSection } from "@/components/pricing-section";
import { FaqsSection } from "@/components/faqs-section";
import { CallToAction } from "@/components/cta";
import { MarketingSection } from "@/components/marketing/MarketingSection";
import { PRICING_PAGE } from "@/lib/marketing-content";

export default function PricingPage() {
  return (
    <main>
      <MarketingSection
        kicker={PRICING_PAGE.kicker}
        title={PRICING_PAGE.title}
        description={PRICING_PAGE.description}
        className="pt-8 md:pt-12"
      >
        <PricingSection />
      </MarketingSection>

      <MarketingSection id="faq" className="mk-section-tight">
        <FaqsSection />
      </MarketingSection>

      <MarketingSection className="mk-section-tight" reveal={false}>
        <CallToAction />
      </MarketingSection>
    </main>
  );
}

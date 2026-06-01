import { PricingSection } from "@/components/pricing-section";
import { FaqsSection } from "@/components/faqs-section";
import { CallToAction } from "@/components/cta";
import { MarketingSection } from "@/components/marketing/MarketingSection";

export default function PricingPage() {
  return (
    <main>
      <MarketingSection
        kicker="Pricing"
        title="Transparent pricing built to scale with your trading journey"
        description="Choose Standard for retail workflows, Premium for low-latency execution, or Scale for multi-account desks. Add analyzer modules and dedicated environments as you grow."
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

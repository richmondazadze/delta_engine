import { Integrations } from "@/components/integrations";
import { Contact } from "@/components/contact";
import { CallToAction } from "@/components/cta";
import { MarketingSection } from "@/components/marketing/MarketingSection";

export default function ComparePage() {
  return (
    <main>
      <MarketingSection
        kicker="CopyMorphic Compare"
        title="Compare brokers and prop firms in one interactive view"
        description="Review drawdown limits, payout policies, refund terms, and program rules side by side — so you pick the right environment before routing capital."
        className="pt-8 md:pt-12"
      >
        <Integrations />
      </MarketingSection>

      <MarketingSection className="mk-section-tight" reveal={false}>
        <CallToAction />
      </MarketingSection>

      <MarketingSection
        id="contact"
        kicker="Support"
        title="Need help choosing the right setup?"
        description="Our team can walk you through platform fit, account structure, and copy configuration for your workflow."
        reveal={false}
      >
        <Contact />
      </MarketingSection>
    </main>
  );
}

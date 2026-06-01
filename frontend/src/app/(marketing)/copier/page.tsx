import { FeatureSection } from "@/components/feature-section";
import { CallToAction } from "@/components/cta";
import { MarketingSection } from "@/components/marketing/MarketingSection";

export default function CopierPage() {
  return (
    <main>
      <MarketingSection
        kicker="CopyMorphic Copier"
        title="Instantly mirror trades with precision risk controls"
        description="Configure master-to-follower replication, lot sizing, equity protection, symbol mapping, and trading-hour filters — then monitor every copied event in a forensic audit log."
        className="pt-8 md:pt-12"
      >
        <FeatureSection />
      </MarketingSection>

      <MarketingSection className="mk-section-tight" reveal={false}>
        <CallToAction />
      </MarketingSection>
    </main>
  );
}

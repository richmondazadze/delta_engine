import { Integrations } from "@/components/integrations";
import { Contact } from "@/components/contact";
import { CallToAction } from "@/components/cta";
import { MarketingSection } from "@/components/marketing/MarketingSection";
import { COMPARE_PAGE } from "@/lib/marketing-content";

export default function ComparePage() {
  const { hero, support } = COMPARE_PAGE;

  return (
    <main>
      <MarketingSection
        kicker={hero.kicker}
        title={hero.title}
        description={hero.description}
        className="pt-8 md:pt-12"
      >
        <Integrations />
      </MarketingSection>

      <MarketingSection className="mk-section-tight" reveal={false}>
        <CallToAction />
      </MarketingSection>

      <MarketingSection
        id="contact"
        kicker={support.kicker}
        title={support.title}
        description={support.description}
        reveal={false}
      >
        <Contact />
      </MarketingSection>
    </main>
  );
}

import Link from "next/link";
import { HeroSection } from "@/components/hero";
import { LogosSection } from "@/components/logos-section";
import { PlatformConnectSection } from "@/components/platform-connect-section";
import { FeatureSection } from "@/components/feature-section";
import { PricingSection } from "@/components/pricing-section";
import { FaqsSection } from "@/components/faqs-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { CallToAction } from "@/components/cta";
import { MarketingSection } from "@/components/marketing/MarketingSection";
import { MarketingReveal, MarketingStagger, MarketingStaggerItem } from "@/components/marketing/MarketingReveal";
import {
  HOME_MISSION,
  HOME_SECTIONS,
  MARKET_TOOLS,
  METRICS,
  PILLARS,
} from "@/lib/marketing-content";

export function LandingPage() {
  return (
    <>
      <MarketingReveal delay={0}>
        <section id="hero">
          <HeroSection />
        </section>
      </MarketingReveal>

      <MarketingSection
        id="mission"
        kicker={HOME_MISSION.kicker}
        title={HOME_MISSION.title}
        description={HOME_MISSION.description}
      >
        <p className="mx-auto max-w-3xl text-center text-xl font-medium tracking-tight text-foreground md:text-2xl">
          {HOME_MISSION.tagline}
        </p>
      </MarketingSection>

      <MarketingSection
        id="supported-platforms"
        kicker={HOME_SECTIONS.platforms.kicker}
        title={HOME_SECTIONS.platforms.title}
        description={HOME_SECTIONS.platforms.description}
      >
        <LogosSection />
        <PlatformConnectSection />
      </MarketingSection>

      <MarketingSection
        id="features"
        kicker={HOME_SECTIONS.features.kicker}
        title={HOME_SECTIONS.features.title}
        description={HOME_SECTIONS.features.description}
      >
        <FeatureSection />
      </MarketingSection>

      <MarketingSection
        id="pillars"
        kicker={HOME_SECTIONS.pillars.kicker}
        title={HOME_SECTIONS.pillars.title}
        description={HOME_SECTIONS.pillars.description}
      >
        <MarketingStagger className="grid gap-6 md:grid-cols-3 md:gap-8">
          {PILLARS.map((pillar) => (
            <MarketingStaggerItem key={pillar.id}>
              <article className="flex h-full flex-col rounded-sm border bg-card p-6 sm:p-8 transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--brand)_35%,var(--border))] hover:shadow-[0_12px_40px_rgb(0_137_123_/_0.08)]">
                <p className="mk-kicker mb-3 text-left">{pillar.label}</p>
                <h3 className="text-xl font-semibold tracking-tight md:text-2xl">{pillar.title}</h3>
                <p className="mk-body mt-4 flex-1">{pillar.body}</p>
                <Link
                  href={pillar.href}
                  className="mt-8 inline-flex text-base font-semibold text-[var(--brand)] transition-colors hover:text-[var(--brand-press)]"
                >
                  Learn more →
                </Link>
              </article>
            </MarketingStaggerItem>
          ))}
        </MarketingStagger>
      </MarketingSection>

      <MarketingSection
        id="metrics"
        kicker={HOME_SECTIONS.metrics.kicker}
        title={HOME_SECTIONS.metrics.title}
        description={HOME_SECTIONS.metrics.description}
        align="center"
      >
        <MarketingStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {METRICS.map((metric) => (
            <MarketingStaggerItem key={metric.label}>
              <article className="h-full rounded-sm border bg-card p-6 sm:p-7 md:p-8">
                <p className="mk-metric-value">{metric.value}</p>
                <p className="mk-metric-label">{metric.label}</p>
                <p className="mk-metric-detail">{metric.detail}</p>
              </article>
            </MarketingStaggerItem>
          ))}
        </MarketingStagger>
      </MarketingSection>

      <MarketingSection
        id="testimonials"
        kicker={HOME_SECTIONS.testimonials.kicker}
        title={HOME_SECTIONS.testimonials.title}
        description={HOME_SECTIONS.testimonials.description}
      >
        <TestimonialsSection />
      </MarketingSection>

      <MarketingSection
        id="pricing"
        kicker={HOME_SECTIONS.pricing.kicker}
        title={HOME_SECTIONS.pricing.title}
        description={HOME_SECTIONS.pricing.description}
      >
        <PricingSection />
      </MarketingSection>

      <MarketingSection id="faq" className="mk-section-tight">
        <FaqsSection />
      </MarketingSection>

      <MarketingSection
        id="market-tools"
        kicker={HOME_SECTIONS.marketTools.kicker}
        title={HOME_SECTIONS.marketTools.title}
        description={HOME_SECTIONS.marketTools.description}
      >
        <MarketingStagger className="grid gap-6 md:grid-cols-3 md:gap-8">
          {MARKET_TOOLS.map((tool) => (
            <MarketingStaggerItem key={tool.title}>
              <article className="h-full rounded-sm border bg-card p-6 sm:p-8">
                <h3 className="text-xl font-semibold tracking-tight">{tool.title}</h3>
                <p className="mk-body mt-4">{tool.body}</p>
                <span className="mt-6 inline-block rounded-sm border border-dashed px-3 py-1.5 text-sm font-medium text-muted-foreground">
                  {tool.status}
                </span>
              </article>
            </MarketingStaggerItem>
          ))}
        </MarketingStagger>
      </MarketingSection>

      <MarketingSection id="cta" className="mk-section-tight" reveal={false}>
        <CallToAction />
      </MarketingSection>
    </>
  );
}

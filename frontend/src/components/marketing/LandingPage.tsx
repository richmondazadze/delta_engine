import Link from "next/link";
import { HeroSection } from "@/components/hero";
import { LogosSection } from "@/components/logos-section";
import { Integrations } from "@/components/integrations";
import { FeatureSection } from "@/components/feature-section";
import { PricingSection } from "@/components/pricing-section";
import { FaqsSection } from "@/components/faqs-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { CallToAction } from "@/components/cta";
import { MarketingSection } from "@/components/marketing/MarketingSection";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { MARKET_TOOLS, METRICS, PILLARS } from "@/lib/marketing-content";

export function LandingPage() {
  return (
    <>
      <MarketingReveal delay={0}>
        <section id="hero">
          <HeroSection />
        </section>
      </MarketingReveal>

      <MarketingSection
        id="supported-platforms"
        kicker="Supported platforms"
        title="Every major trading environment, one connected stack"
        description="CopyMorphic integrates with the platforms prop firms, futures desks, and multi-account traders rely on — so you can connect once and operate everywhere."
      >
        <LogosSection />
        <div className="mt-16 md:mt-20">
          <Integrations />
        </div>
      </MarketingSection>

      <MarketingSection
        id="features"
        kicker="Platform capabilities"
        title="Every feature designed for control, clarity, and measurable results"
        description="From cloud-native copying to forensic execution logs and portfolio analytics, CopyMorphic gives serious traders infrastructure they can trust."
      >
        <FeatureSection />
      </MarketingSection>

      <MarketingSection
        id="pillars"
        kicker="Product pillars"
        title="Copier, Analyzer, and Compare — built to work together"
        description="Three connected modules that reduce complexity in modern trading and support smarter decisions across your entire operation."
      >
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {PILLARS.map((pillar) => (
            <article
              key={pillar.id}
              className="flex flex-col rounded-sm border bg-card p-8 transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--brand)_35%,var(--border))] hover:shadow-[0_12px_40px_rgb(0_137_123_/_0.08)]"
            >
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
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        id="metrics"
        kicker="Trusted by traders"
        title="Performance you can measure, not just claim"
        align="center"
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {METRICS.map((metric) => (
            <article key={metric.label} className="rounded-sm border bg-card p-7 md:p-8">
              <p className="mk-metric-value">{metric.value}</p>
              <p className="mk-metric-label">{metric.label}</p>
              <p className="mk-metric-detail">{metric.detail}</p>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        id="testimonials"
        kicker="Social proof"
        title="Built for traders who cannot afford silent failures"
        description="Prop traders and multi-account operators choose CopyMorphic for execution reliability, transparent logs, and portfolio clarity."
      >
        <TestimonialsSection />
      </MarketingSection>

      <MarketingSection
        id="pricing"
        kicker="Pricing"
        title="Transparent pricing built to scale with your trading journey"
        description="Start with flexible MT5 workflows, then expand into premium latency tiers, analyzer add-ons, and dedicated environments as you grow."
      >
        <PricingSection />
      </MarketingSection>

      <MarketingSection id="faq" className="mk-section-tight">
        <FaqsSection />
      </MarketingSection>

      <MarketingSection
        id="market-tools"
        kicker="Market tools"
        title="Stay informed with real-time market context"
        description="Sentiment, macro events, and curated news — integrated into the same ecosystem as your copier and analytics."
      >
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {MARKET_TOOLS.map((tool) => (
            <article key={tool.title} className="rounded-sm border bg-card p-8">
              <h3 className="text-xl font-semibold tracking-tight">{tool.title}</h3>
              <p className="mk-body mt-4">{tool.body}</p>
              <span className="mt-6 inline-block rounded-sm border border-dashed px-3 py-1.5 text-sm font-medium text-muted-foreground">
                {tool.status}
              </span>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection id="cta" className="mk-section-tight" reveal={false}>
        <CallToAction />
      </MarketingSection>
    </>
  );
}

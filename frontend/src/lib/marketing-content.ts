export const PLATFORMS = [
  "MetaTrader 5",
  "MetaTrader 4",
  "cTrader",
  "DXtrade",
  "TradeLocker",
  "NinjaTrader",
  "Tradovate",
  "ProjectX",
  "Rithmic",
  "Match Trader",
] as const;

/* ─── Home ─────────────────────────────────────────────────────────── */

export const HERO = {
  kicker: "Connect · Copy · Analyze · Smarter",
  title: "One intelligent platform for your trading journey",
  description:
    "Connect your accounts, follow proven strategies, and gain actionable insights — all in one cloud command center built to reduce complexity and support smarter decisions.",
  primaryCta: "Create free workspace",
  secondaryCta: "See plans",
  footnote: "Free tier available · No setup fees · Cancel anytime",
} as const;

export const HOME_MISSION = {
  kicker: "Why CopyMorphic",
  title: "Built to reduce complexity in modern trading",
  description:
    "We designed CopyMorphic for traders who operate across multiple accounts, platforms, and strategies — and need one place to copy, measure, and decide with confidence.",
  tagline: "Every account, every strategy, every insight — connected in one place.",
} as const;

export const HOME_SECTIONS = {
  platforms: {
    kicker: "Supported platforms",
    title: "Every major trading environment, one connected stack",
    description:
      "MT5 and DXtrade are live today — with MT4, cTrader, TradeLocker, and more on the roadmap. Link once, configure copy rules once, and monitor every pipeline from one dashboard.",
  },
  features: {
    kicker: "Platform capabilities",
    title: "Everything designed for control, clarity, and measurable results",
    description:
      "From fast cloud copying to forensic execution logs and copy-performance stats, CopyMorphic gives you the infrastructure to execute with precision and review with confidence.",
  },
  pillars: {
    kicker: "Product pillars",
    title: "Copier, Performance, and platform coverage — one ecosystem",
    description:
      "Mirror trades with risk controls, review copy execution in Performance, and see which platforms are live today — with broker comparison tools on the roadmap.",
  },
  metrics: {
    kicker: "Results & analytics",
    title: "Measure performance, not just profits",
    description:
      "Green days feel good and red days hurt — but edge lives in when you win, how you win, and why you lose. CopyMorphic surfaces the numbers that matter.",
  },
  testimonials: {
    kicker: "Social proof",
    title: "Trusted by traders who need reliability at scale",
    description:
      "Prop desks, signal groups, and multi-account operators choose CopyMorphic for execution speed, transparent logs, and portfolio-level clarity.",
  },
  pricing: {
    kicker: "Pricing",
    title: "Transparent pricing built to scale with your trading journey",
    description:
      "Start on the free tier or Standard per account, upgrade to Premium when latency matters, and add the Analyzer module when you want deeper portfolio stats.",
  },
  marketTools: {
    kicker: "Market intelligence · Roadmap",
    title: "Context tools we're building into the same workspace",
    description:
      "Market sentiment, economic calendar, and curated news are on the roadmap — integrated alongside your copier and analytics so context won't live in a separate tab.",
  },
  cta: {
    title: "Ready to trade with full visibility?",
    description:
      "Create your workspace, connect your accounts, and launch your first copy path in minutes — with risk controls, execution logs, and performance stats from day one.",
  },
} as const;

export const METRICS = [
  {
    value: "Win rate",
    label: "Per account & portfolio",
    detail: "Track consistency across masters, followers, and aggregated book performance.",
  },
  {
    value: "Drawdown",
    label: "Risk you can see early",
    detail: "Monitor peak-to-trough exposure before it becomes a blown account or failed evaluation.",
  },
  {
    value: "Profit factor",
    label: "Edge vs. noise",
    detail: "Separate sustainable performance from lucky streaks with distribution-aware analytics.",
  },
  {
    value: "Sub-second",
    label: "Copy detection target",
    detail: "Cloud workers poll and route copies quickly — actual latency varies by platform, broker, and your plan.",
  },
] as const;

export const PILLARS = [
  {
    id: "copier",
    label: "CopyMorphic Copier",
    title: "Mirror top traders — instantly, accurately, automatically",
    body: "Connect accounts across platforms, copy with advanced risk settings, and monitor every event in your copy log — 24/7 mirroring without VPS babysitting.",
    href: "/copier",
  },
  {
    id: "analyzer",
    label: "CopyMorphic Analyzer",
    title: "Portfolio stats and copy-performance clarity",
    body: "Add the Analyzer module for ROI, win rate, profit factor, and equity trends — plus in-app Performance stats for copy execution success.",
    href: "/analyzer",
  },
  {
    id: "compare",
    label: "Platform coverage",
    title: "See what's live today and what's coming next",
    body: "MT5 and DXtrade are supported now, with more connectors on the roadmap. Interactive broker and prop-firm comparison is planned for a future release.",
    href: "/compare",
  },
] as const;

export const MARKET_TOOLS = [
  {
    title: "Market Sentiment",
    body: "See how traders are positioned across Forex, Crypto, and Indices — bullish vs. bearish gauges that add context to your copied strategies.",
    status: "Coming soon" as const,
  },
  {
    title: "Economic Calendar",
    body: "Track and alert on macro events that can move your accounts — from NFP to central bank decisions, without leaving your dashboard.",
    status: "Coming soon" as const,
  },
  {
    title: "Market News",
    body: "Curated financial headlines filtered for relevance — stay informed while you manage copiers, risk, and portfolio analytics.",
    status: "Coming soon" as const,
  },
] as const;

/* ─── Analyzer page ────────────────────────────────────────────────── */

export const ANALYZER_PAGE = {
  hero: {
    kicker: "CopyMorphic Analyzer",
    title: "Portfolio analytics add-on — plus copy-performance stats in your dashboard",
    description:
      "The Analyzer plan adds ROI, win rate, profit factor, and equity charts. Today, the Performance page shows copy execution success — deeper trade analytics are expanding with the Analyzer module.",
    cta: "View Analyzer pricing",
  },
  problem: {
    kicker: "The performance gap",
    title: "Green days feel good. Red days hurt. Edge lives in the pattern.",
    description:
      "You celebrate winning sessions and lament losing ones — but sustainable edge lives in timing, sizing, instrument selection, and the habits behind your results. Analyzer helps make those patterns visible as the module grows.",
  },
  pillars: [
    {
      title: "Portfolio ROI",
      body: "Track return on equity and growth trends across linked accounts — included with the Analyzer add-on.",
    },
    {
      title: "Win rate & profit factor",
      body: "See whether edge is real or accidental with headline stats and symbol breakdowns.",
    },
    {
      title: "Copy performance today",
      body: "The Performance page already shows copy success rate, failures, and latency from your execution log.",
    },
  ],
  features: {
    kicker: "Feature deep-dive",
    title: "Analyze every step. Build the habits that move performance.",
    description:
      "Win rate and drawdown, profitability analysis, and trade distribution — metrics serious operators review before scaling capital.",
    items: [
      {
        title: "Win rate & drawdown",
        body: "Track consistency and peak risk per account or across your full portfolio.",
      },
      {
        title: "Profitability analysis",
        body: "Net P&L, profit factor, and expectancy — see whether edge is real or accidental.",
      },
      {
        title: "Trade distribution",
        body: "Understand how wins and losses cluster by size, symbol, and time of day.",
      },
    ],
  },
  control: {
    kicker: "Execution & control",
    title: "Turn data into clarity — and clarity into confident execution",
    description:
      "Analyzer gives you back control across every account and strategy: know what to scale, what to pause, and what to cut before capital does the talking.",
  },
  testimonials: {
    kicker: "What traders say",
    title: "Clarity that changes how you manage risk",
    description:
      "Operators use performance stats to refine allocation, kill underperforming copy paths faster, and scale what is actually working.",
  },
} as const;

/* ─── Copier page ──────────────────────────────────────────────────── */

export const COPIER_PAGE = {
  hero: {
    kicker: "CopyMorphic Copier",
    title: "Connect your accounts to mirror top traders — instantly, accurately, automatically",
    description:
      "Cloud-native trade copying with symbol mapping, equity protection, and forensic logs — built for traders who scale by following the right people with the right plan.",
    cta: "Start copying",
  },
  strategy: {
    kicker: "Copy with purpose",
    title: "Grow by following the right people — with rules that protect your capital",
    description:
      "Most traders either chase signals without structure or over-manage every ticket. CopyMorphic lets you mirror proven workflows while keeping risk, sizing, and symbol logic under your control.",
  },
  pillars: [
    {
      title: "24/7 mirroring",
      body: "Cloud execution keeps copy paths running while you sleep — no VPS, no terminal lock-ins.",
    },
    {
      title: "Fast execution",
      body: "Low-latency routing designed for time-sensitive replication across linked accounts.",
    },
    {
      title: "Advanced risk settings",
      body: "Daily loss limits, lot multipliers, equity protection, and symbol filters — configured once, enforced always.",
    },
  ],
  benefits: {
    kicker: "Operational benefits",
    title: "You don't need to trade alone — copy intelligently, control your risk",
    description:
      "Trade like the best without surrendering oversight. Every open, close, skip, and failure is logged with latency and broker context for full auditability.",
  },
  technical: {
    title: "Commit to execution at a fraction of what brokers charge for unmanaged setups",
    description:
      "Replace scattered scripts and manual terminal workflows with one dashboard — setup in minutes, monitor on a refresh cycle, scale when you are ready.",
  },
  features: {
    kicker: "Every feature, simplified to copy",
    title: "Risk, mapping, settings, and monitoring — in one control surface",
    items: [
      {
        title: "Risk management",
        body: "Daily loss caps, lockouts, max lot rules, and equity protection on every follower account.",
      },
      {
        title: "Symbol mapping",
        body: "Align instrument names when brokers differ — copy across MT5, cTrader, futures, and prop environments.",
      },
      {
        title: "Advanced settings",
        body: "Lot sizing modes, trading-hour filters, reverse copy, and per-path overrides for complex desks.",
      },
      {
        title: "Execution monitoring",
        body: "Connection health, latency from your copy log, active paths, and a forensic record of every copied event.",
      },
    ],
  },
} as const;

/* ─── Compare / Platforms page ─────────────────────────────────────── */

export const COMPARE_PAGE = {
  hero: {
    kicker: "Platform coverage",
    title: "Supported platforms today — and what's on the roadmap",
    description:
      "MT5 and DXtrade are live now. Additional connectors and an interactive broker comparison tool are in development — see status below and contact us for enterprise fit.",
  },
  support: {
    kicker: "Support",
    title: "Need help choosing the right setup?",
    description:
      "Our team can walk you through platform fit, account structure, and copy configuration for your workflow — from first evaluation to funded accounts.",
  },
} as const;

/* ─── Pricing page ─────────────────────────────────────────────────── */

export const PRICING_PAGE = {
  kicker: "Pricing",
  title: "Transparent pricing built to scale with your trading journey",
  description:
    "Start free, then choose Standard per linked account, Premium for priority routing, or add the Analyzer module for portfolio analytics. Switch plans anytime from billing.",
} as const;

export const PRICING_PLANS = [
  {
    icon: "users" as const,
    description:
      "Ideal for prop traders and retail — pay only for each linked account you copy with.",
    name: "Standard",
    price: "$9",
    period: "/account / month",
    planId: "standard" as const,
    variant: "outline" as const,
    features: [
      "Pay per linked account",
      "MT5 & DXtrade copy paths",
      "Equity protection & risk rules",
      "Copy log & performance stats",
      "Email support",
    ],
  },
  {
    icon: "briefcase" as const,
    description:
      "For time-sensitive workflows — priority routing and faster copy detection.",
    name: "Premium",
    badge: "Popular",
    price: "$14",
    period: "/account / month",
    planId: "premium" as const,
    variant: "default" as const,
    features: [
      "Everything in Standard",
      "Priority copy routing",
      "Lower-latency worker path",
      "Priority support",
    ],
  },
  {
    icon: "building" as const,
    name: "Analyzer",
    description: "Portfolio analytics add-on — ROI, win rate, profit factor, equity growth.",
    price: "$27.99",
    period: "/month",
    planId: "analyzer" as const,
    variant: "outline" as const,
    features: [
      "Portfolio ROI & win rate",
      "Profit factor tracking",
      "Symbol breakdown",
      "Equity growth charts",
    ],
  },
] as const;

/* ─── FAQs ─────────────────────────────────────────────────────────── */

export const FAQ_SECTION = {
  title: "Pricing questions",
  description:
    "Common questions about plans, billing, platform support, upgrades, and getting started with CopyMorphic.",
} as const;

export const FAQ_ITEMS = [
  {
    id: "item-1",
    title: "Can I switch plans later?",
    content:
      "Yes. Upgrade, downgrade, or change billing cycles anytime from Settings → Billing. Changes apply on your next billing date — move to Premium when you need priority routing, or add Analyzer when you want portfolio analytics.",
  },
  {
    id: "item-2",
    title: "Is there a free tier?",
    content:
      "Yes. You can create a workspace and explore the dashboard on the free tier with limited linked accounts. Upgrade to Standard or Premium when you need full copy capacity per account, or add Analyzer from billing when you're ready.",
  },
  {
    id: "item-3",
    title: "Do you offer refunds?",
    content:
      "Refund requests are handled according to our billing policy. Contact support with your account details and we will review eligible cases promptly.",
  },
  {
    id: "item-4",
    title: "Which platforms are supported?",
    content:
      "MT5 and DXtrade are live today. MT4, cTrader, Match Trader, TradeLocker, DXtrade, NinjaTrader, Tradovate, ProjectX, and Rithmic are on the roadmap — check the Platforms page for current status.",
  },
  {
    id: "item-5",
    title: "Is there a setup fee?",
    content: "No setup fees. You pay for your selected plan and any optional add-ons only.",
  },
  {
    id: "item-6",
    title: "Can I cancel anytime?",
    content:
      "Yes. Cancel from account settings and retain access through the end of your current billing period.",
  },
  {
    id: "item-7",
    title: "What's included in Premium vs Standard?",
    content:
      "Standard covers multi-platform linking, risk rules, and execution logs per linked account. Premium adds priority copy routing, a lower-latency worker path, and priority support — ideal when execution speed and uptime matter most.",
  },
] as const;

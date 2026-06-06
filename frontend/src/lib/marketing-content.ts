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
  primaryCta: "Start free today",
  secondaryCta: "See plans",
  footnote: "Start free today · Cancel anytime · No setup fees",
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
      "MT4, MT5, cTrader, DXtrade, TradeLocker, and more — link once, configure copy rules once, and monitor every pipeline from a single operations dashboard.",
  },
  features: {
    kicker: "Platform capabilities",
    title: "Everything designed for control, clarity, and measurable results",
    description:
      "From lightning-fast copying to forensic execution logs and portfolio analytics, CopyMorphic gives you the infrastructure to execute with precision and review with confidence.",
  },
  pillars: {
    kicker: "Product pillars",
    title: "Copier, Analyzer, and Compare — one ecosystem",
    description:
      "Three connected modules that mirror top traders, reveal what your data is really saying, and help you choose the right broker or prop firm before you deploy capital.",
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
      "Start with flexible workflows, add low-latency execution when you need it, and expand into analyzer modules and dedicated environments as your operation grows.",
  },
  marketTools: {
    kicker: "Market intelligence",
    title: "Stay informed with real-time market data, trade sentiment, and global events",
    description:
      "Market sentiment, economic calendar, and curated news — integrated into the same ecosystem as your copier and analytics, so context never lives in a separate tab.",
  },
  cta: {
    title: "Ready to trade with full visibility?",
    description:
      "Create your workspace, connect your accounts, and launch your first copy path in minutes — with risk controls, execution logs, and analytics from day one.",
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
    value: "20ms",
    label: "Average copy speed",
    detail: "Low-latency cloud execution for time-sensitive and multi-account workflows.",
  },
] as const;

export const PILLARS = [
  {
    id: "copier",
    label: "CopyMorphic Copier",
    title: "Mirror top traders — instantly, accurately, automatically",
    body: "Connect accounts across platforms, copy with advanced risk settings, and monitor every event in real time — 24/7 mirroring without VPS babysitting.",
    href: "/copier",
  },
  {
    id: "analyzer",
    label: "CopyMorphic Analyzer",
    title: "Reveal the truth behind every win, loss, and pattern",
    body: "Connect your trading world to deep historical analysis, advanced filtering, and behavioral insights — so you build habits that actually move performance.",
    href: "/analyzer",
  },
  {
    id: "compare",
    label: "CopyMorphic Compare",
    title: "Pick the right broker or prop firm before you trade",
    body: "Compare drawdown limits, payout rules, and program terms side by side — spend less time researching and more time executing with the right setup.",
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
    title: "Connect your trading world to reveal the truth behind every win, loss, and pattern",
    description:
      "Most traders measure profits, not performance. CopyMorphic Analyzer shows when you win, how you win, and why you lose — across every account and strategy you run.",
    cta: "Try Analyzer",
  },
  problem: {
    kicker: "The performance gap",
    title: "Green days feel good. Red days hurt. Edge lives in the pattern.",
    description:
      "You celebrate winning sessions and lament losing ones — but sustainable edge lives in timing, sizing, instrument selection, and the habits behind your results. Analyzer makes those patterns visible.",
  },
  pillars: [
    {
      title: "Full analysis",
      body: "Deep dives into historical trades, session performance, and account-level trends — not just headline P&L.",
    },
    {
      title: "Advanced filtering",
      body: "Slice results by symbol, session, master account, copy path, or time window to find what actually drives returns.",
    },
    {
      title: "Behavioral insights",
      body: "Spot overtrading, revenge sizing, and consistency breakdowns before they show up on your statement.",
    },
  ],
  features: {
    kicker: "Feature deep-dive",
    title: "Analyze every step. Build the habits that move performance.",
    description:
      "Win rate and drawdown, profitability analysis, and trade distribution — the metrics serious operators review before scaling capital.",
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
      "Operators use Analyzer to refine allocation, kill underperforming copy paths faster, and scale what is actually working.",
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
    title: "Scale by following the right people — with rules that protect your capital",
    description:
      "Most traders either chase signals without structure or over-manage every ticket. CopyMorphic lets you mirror proven workflows while keeping risk, sizing, and symbol logic under your control.",
  },
  pillars: [
    {
      title: "24/7 mirroring",
      body: "Cloud execution keeps copy paths running while you sleep — no VPS, no terminal lock-ins.",
    },
    {
      title: "Lightning-fast execution",
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
      "Replace scattered scripts and manual terminal workflows with one dashboard — setup in minutes, monitor in real time, scale when you are ready.",
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
        title: "Real-time monitoring",
        body: "Live connection health, latency, active paths, and a forensic log of every copied event.",
      },
    ],
  },
} as const;

/* ─── Compare page ─────────────────────────────────────────────────── */

export const COMPARE_PAGE = {
  hero: {
    kicker: "CopyMorphic Compare",
    title: "Compare brokers and prop firms before you route capital",
    description:
      "Drawdown limits, payout policies, refund terms, and program rules — side by side in one interactive view so you pick the right environment first.",
  },
  support: {
    kicker: "Support",
    title: "Need help choosing the right setup?",
    description:
      "Our team can walk you through platform fit, account structure, and copy configuration for your workflow — from first evaluation to funded scale.",
  },
} as const;

/* ─── Pricing page ─────────────────────────────────────────────────── */

export const PRICING_PAGE = {
  kicker: "Pricing",
  title: "Transparent pricing built to scale with your trading journey",
  description:
    "Choose Standard to get started, Premium Pro for low-latency execution, or Scale for multi-account desks. Switch plans anytime — monthly, quarterly, or annual billing when available.",
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
      "Yes. Upgrade, downgrade, or change billing cycles anytime from your dashboard. Changes apply on your next billing date — move to Premium Pro when you need lower latency, or Scale when your desk outgrows account limits.",
  },
  {
    id: "item-2",
    title: "What happens after the free trial?",
    content:
      "Your workspace stays accessible. Choose a paid plan to continue copying at full capacity, or adjust account limits to match your selected tier. Analyzer add-ons can be enabled when you are ready for deeper performance review.",
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
      "CopyMorphic integrates with MetaTrader 4, MetaTrader 5, cTrader, Match Trader, TradeLocker, DXtrade, NinjaTrader, Tradovate, ProjectX, and Rithmic — all from one connected stack.",
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
    title: "What's included in Premium Pro vs Standard?",
    content:
      "Standard covers multi-platform linking, risk rules, and execution logs. Premium Pro adds a low-latency copy path, priority support, HFT-friendly routing, and readiness for Analyzer modules — ideal when execution speed and uptime matter most.",
  },
] as const;

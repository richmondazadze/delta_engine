export const PLATFORMS = [
  "MetaTrader 4",
  "MetaTrader 5",
  "cTrader",
  "Match Trader",
  "TradeLocker",
  "DXtrade",
  "NinjaTrader",
  "Tradovate",
  "ProjectX",
  "Rithmic",
] as const;

export const HERO = {
  kicker: "Connect · Copy · Analyze · Smarter",
  title: "One intelligent platform for your trading journey",
  description:
    "Connect your trading accounts, mirror proven strategies with precision, and track performance across every account — with full execution logs, risk controls, and portfolio visibility in one cloud command center.",
  primaryCta: "Start free today",
  secondaryCta: "See plans",
} as const;

export const METRICS = [
  {
    value: "20ms",
    label: "Average copy speed",
    detail: "Low-latency cloud execution path for time-sensitive workflows.",
  },
  {
    value: "99.9%",
    label: "Platform uptime",
    detail: "Managed infrastructure designed for continuous copier operations.",
  },
  {
    value: "100M+",
    label: "Trades copied",
    detail: "Architecture built for high-volume multi-account replication.",
  },
  {
    value: "24/7",
    label: "Risk monitoring",
    detail: "Continuous visibility into drawdown, lockouts, and execution health.",
  },
] as const;

export const PILLARS = [
  {
    id: "copier",
    label: "CopyMorphic Copier",
    title: "Instantly mirror trades with flexible risk settings",
    body: "Link master and follower accounts, configure lot sizing, equity protection, symbol mapping, and trading-hour filters — then monitor every copied event in real time.",
    href: "/copier",
  },
  {
    id: "analyzer",
    label: "CopyMorphic Analyzer",
    title: "See ROI, drawdown, and consistency across accounts",
    body: "Connect all your accounts and get a complete picture of what is working. Track performance per account or aggregate portfolio results from one dashboard.",
    href: "/analyzer",
  },
  {
    id: "compare",
    label: "CopyMorphic Compare",
    title: "Compare brokers and prop firms side by side",
    body: "Review drawdown limits, payout policies, and program rules in one interactive table so you spend less time researching and more time executing.",
    href: "/compare",
  },
] as const;

export const MARKET_TOOLS = [
  {
    title: "Market Sentiments",
    body: "See how traders are positioned across major instruments — long vs short percentages for Forex, Crypto, and Indices.",
    status: "Coming soon" as const,
  },
  {
    title: "Economic Calendar",
    body: "Track and set alerts for key global economic events that can move your copied strategies.",
    status: "Coming soon" as const,
  },
  {
    title: "Market News",
    body: "Stay updated with curated financial headlines without leaving your operations dashboard.",
    status: "Coming soon" as const,
  },
] as const;

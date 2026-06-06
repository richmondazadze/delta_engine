import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import "../marketing.css";
import "../marketing-polish.css";
import "../marketing-mobile.css";

export const metadata: Metadata = {
  title: `${APP_NAME} — Intelligent Trading Platform`,
  description: APP_TAGLINE,
  openGraph: {
    title: `${APP_NAME} — Intelligent Trading Platform`,
    description: APP_TAGLINE,
    type: "website",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-page">
      <MarketingNav />
      {children}
      <MarketingFooter />
    </div>
  );
}

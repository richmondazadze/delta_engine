import Link from "next/link";
import { APP_NAME, APP_SUPPORT_EMAIL } from "@/lib/brand";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Home
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Terms of Use</h1>
      <p className="mt-2 text-muted-foreground">Last updated: June 2026</p>
      <div className="prose prose-neutral mt-8 max-w-none space-y-4 text-base leading-relaxed text-muted-foreground dark:prose-invert">
        <p>
          By using {APP_NAME}, you agree to these terms. If you do not agree, do not use the
          service.
        </p>
        <h2 className="text-lg font-semibold text-foreground">Service</h2>
        <p>
          We provide software to copy trades between linked accounts. You are responsible for
          compliance with your broker, prop firm, and local regulations.
        </p>
        <h2 className="text-lg font-semibold text-foreground">Billing</h2>
        <p>
          Paid plans are billed via Stripe per our pricing page. Subscriptions renew automatically
          unless canceled in the billing portal.
        </p>
        <h2 className="text-lg font-semibold text-foreground">Disclaimer</h2>
        <p>
          Trading involves risk. {APP_NAME} does not provide financial advice. Past performance does
          not guarantee future results.
        </p>
        <h2 className="text-lg font-semibold text-foreground">Contact</h2>
        <p>
          <a href={`mailto:${APP_SUPPORT_EMAIL}`} className="text-foreground underline">
            {APP_SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </main>
  );
}

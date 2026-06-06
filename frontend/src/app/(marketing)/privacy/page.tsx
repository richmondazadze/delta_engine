import Link from "next/link";
import { APP_NAME, APP_SUPPORT_EMAIL } from "@/lib/brand";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Home
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-muted-foreground">Last updated: June 2026</p>
      <div className="prose prose-neutral mt-8 max-w-none space-y-4 text-base leading-relaxed text-muted-foreground dark:prose-invert">
        <p>
          {APP_NAME} (&quot;we&quot;, &quot;us&quot;) operates a cloud trade-copying platform. This
          policy describes how we collect, use, and protect your information.
        </p>
        <h2 className="text-lg font-semibold text-foreground">Information we collect</h2>
        <ul className="list-disc pl-5">
          <li>Account email and profile from Supabase Auth</li>
          <li>Trading account credentials (encrypted at rest with AES-256-GCM)</li>
          <li>Execution logs, balances, and copy configuration</li>
          <li>Billing identifiers from Stripe (we do not store full card numbers)</li>
        </ul>
        <h2 className="text-lg font-semibold text-foreground">How we use data</h2>
        <p>
          To provide trade copying, risk controls, analytics, billing, and support. We do not sell
          your personal data.
        </p>
        <h2 className="text-lg font-semibold text-foreground">Contact</h2>
        <p>
          Questions:{" "}
          <a href={`mailto:${APP_SUPPORT_EMAIL}`} className="text-foreground underline">
            {APP_SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { APP_NAME, APP_TAGLINE, APP_TITLE } from "@/lib/brand";
import { fontSans, fontSansSettings } from "@/lib/fonts";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_TAGLINE,
  applicationName: APP_NAME,
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body
        style={{
          fontFamily: `"${fontSans}", "Google Sans Flex", sans-serif`,
          fontOpticalSizing: "auto",
          fontVariationSettings: fontSansSettings,
        }}
      >
        {children}
      </body>
    </html>
  );
}

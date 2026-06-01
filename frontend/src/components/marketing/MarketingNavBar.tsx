"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Icon } from "@/components/icons/Icon";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

type Props = {
  signedIn: boolean;
};

export function MarketingNavBar({ signedIn }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={`mk-nav${scrolled ? " mk-nav-scrolled" : ""}`}>
      <div className="mk-container mk-nav-inner">
        <Link href="/" className="mk-nav-brand" aria-label="CopyMorphic home">
          <BrandLogo variant="full" showName={false} />
        </Link>

        <nav className="mk-nav-links" aria-label="Primary">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          {!signedIn && (
            <Link href="/login" className="mk-nav-login-desktop">
              Login
            </Link>
          )}
        </nav>

        <div className="mk-nav-actions">
          {signedIn ? (
            <Link href="/dashboard" className="btn btn-accent btn-sm">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm mk-nav-login-mobile">
                Login
              </Link>
              <Link href="/register" className="btn btn-accent btn-sm">
                Get started
              </Link>
            </>
          )}
          <button
            type="button"
            className="mk-nav-toggle"
            aria-expanded={open}
            aria-controls="mk-mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "x" : "menu"} size={18} />
          </button>
        </div>
      </div>

      <div id="mk-mobile-menu" className={`mk-mobile-menu${open ? " open" : ""}`}>
        <nav aria-label="Mobile">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          {!signedIn && (
            <Link href="/login" onClick={() => setOpen(false)}>
              Login
            </Link>
          )}
          {signedIn ? (
            <Link href="/dashboard" className="btn btn-accent btn-block" onClick={() => setOpen(false)}>
              Go to dashboard
            </Link>
          ) : (
            <Link href="/register" className="btn btn-accent btn-block" onClick={() => setOpen(false)}>
              Get started
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

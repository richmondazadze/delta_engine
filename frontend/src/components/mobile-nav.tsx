"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { navLinks } from "@/components/header";
import { MarketingNavAuth } from "@/components/marketing/MarketingNavAuth";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const PANEL_EASE = [0.22, 1, 0.36, 1] as const;

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span
      className={cn("relative flex h-5 w-5 flex-col items-center justify-center gap-1.5", open && "mk-hamburger-open")}
      aria-hidden
    >
      <span className="mk-hamburger-line mk-hamburger-line-top block h-0.5 w-5 rounded-full bg-current" />
      <span className="mk-hamburger-line mk-hamburger-line-middle block h-0.5 w-5 rounded-full bg-current" />
      <span className="mk-hamburger-line mk-hamburger-line-bottom block h-0.5 w-5 rounded-full bg-current" />
    </span>
  );
}

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const reduceMotion = useReducedMotion();

  const closeMenu = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeMenu]);

  const panelTransition = reduceMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, damping: 32, stiffness: 340, mass: 0.85 };

  return (
    <div className="lg:hidden">
      <Button
        aria-controls="mobile-menu"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="h-10 w-10"
        onClick={() => setOpen((v) => !v)}
        size="icon"
        variant="outline"
      >
        <HamburgerIcon open={open} />
      </Button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="mk-mobile-backdrop fixed inset-0 z-40 bg-background/75 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.35, ease: PANEL_EASE }}
              onClick={closeMenu}
            />
            <motion.nav
              id="mobile-menu"
              className="mk-mobile-panel fixed inset-y-0 right-0 z-50 flex w-[min(100vw,22rem)] flex-col border-l bg-background/98 p-5 pt-24 shadow-2xl backdrop-blur-xl"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={panelTransition}
            >
              <div className="grid gap-1">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{
                      delay: reduceMotion ? 0 : 0.08 + index * 0.05,
                      duration: reduceMotion ? 0.01 : 0.45,
                      ease: PANEL_EASE,
                    }}
                  >
                    <Button
                      className="mk-mobile-nav-item mk-nav-link h-12 w-full justify-start px-4 text-base"
                      variant="ghost"
                      render={<Link href={link.href} onClick={closeMenu} />}
                      nativeButton={false}
                    >
                      {link.label}
                    </Button>
                  </motion.div>
                ))}
              </div>
              <motion.div
                className="mt-auto flex flex-col gap-3 border-t pt-6"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{
                  delay: reduceMotion ? 0 : 0.28,
                  duration: reduceMotion ? 0.01 : 0.45,
                  ease: PANEL_EASE,
                }}
              >
                <MarketingNavAuth layout="mobile" onNavigate={closeMenu} />
              </motion.div>
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

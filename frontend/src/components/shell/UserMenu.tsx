"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "./AppProvider";
import { initials } from "@/lib/format";

export function UserMenu() {
  const router = useRouter();
  const { email, subscriptionPlan, signOut } = useApp();
  const [signingOut, setSigningOut] = useState(false);

  const planLabel =
    subscriptionPlan === "free"
      ? "Free plan"
      : `${subscriptionPlan.charAt(0).toUpperCase()}${subscriptionPlan.slice(1)} plan`;

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="user-menu-trigger" aria-label="Account menu">
        <span className="h-av">{initials(email || "CM")}</span>
        <Icon name="chevronDown" size={14} className="user-menu-chevron hide-mobile-sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="user-menu-content w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <span className="truncate text-sm font-semibold text-foreground">
                {email || "Signed in"}
              </span>
              <span className="text-xs text-muted-foreground">{planLabel}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Icon name="settings" size={15} />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings/billing")}>
            <Icon name="cards" size={15} />
            Billing
          </DropdownMenuItem>
          {subscriptionPlan === "admin" ? (
            <DropdownMenuItem onClick={() => router.push("/admin/overview")}>
              <Icon name="shield" size={15} />
              Operations console
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
          >
            <Icon name="power" size={15} />
            {signingOut ? "Signing out…" : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

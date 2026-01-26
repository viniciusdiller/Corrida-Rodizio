"use client";

import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";

interface RoomHeaderProps {
  onExit: () => void;
  accountPill?: ReactNode;
}

export function RoomHeader({ onExit, accountPill }: RoomHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">{accountPill}</div>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </div>
  );
}

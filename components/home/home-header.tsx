import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { DonateButton } from "@/components/donate-button";

interface HomeHeaderProps {
  isCompact?: boolean;
  accountPill?: ReactNode;
  onOpenAccountMenu?: () => void;
}

export function HomeHeader({
  isCompact,
  accountPill,
  onOpenAccountMenu,
}: HomeHeaderProps) {
  const logoSize = isCompact ? "h-28 md:h-32" : "h-44 md:h-56";

  return (
    <div className="text-center transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-2 pt-4 md:pt-6">
        <div className="min-w-0">{accountPill}</div>
        <div className="flex items-center gap-2">
          <DonateButton />
          <LanguageToggle />
          <ThemeToggle />
          <NotificationCenter onOpenAccountMenu={onOpenAccountMenu} />
        </div>
      </div>
      <div
        className={`transition-all duration-300 ${
          isCompact ? "space-y-1 -mt-6 md:mt-0" : "space-y-4 -mt-6 md:mt-0"
        } mt-4`}
      >
        <div className="flex flex-col items-center">
          <img
            src="/logo-big-light.png"
            alt="Rodizio Race"
            className={`block dark:hidden w-auto ${logoSize} transition-all duration-300`}
          />
          <img
            src="/logo-big-dark.png"
            alt="Rodizio Race"
            className={`hidden dark:block w-auto ${logoSize} transition-all duration-300`}
          />
          <p
            className={`text-muted-foreground font-medium uppercase tracking-widest text-sm md:text-base transition-all duration-300 ${
              isCompact ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
            }`}
          >
            {"A elite da comilan\u00e7a competitiva"}
          </p>
        </div>
      </div>
    </div>
  );
}

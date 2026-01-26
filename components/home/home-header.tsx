import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";

interface HomeHeaderProps {
  isCompact?: boolean;
}

export function HomeHeader({ isCompact }: HomeHeaderProps) {
  const logoSize = isCompact ? "h-32 md:h-36" : "h-52 md:h-64";

  return (
    <div className="text-center transition-all duration-300">
      <div className="flex justify-end pt-4 md:pt-6">
        <LanguageToggle />
        <ThemeToggle />
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

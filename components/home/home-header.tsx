import { Trophy } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface HomeHeaderProps {
  isCompact?: boolean;
}

export function HomeHeader({ isCompact }: HomeHeaderProps) {
  return (
    <div className="text-center transition-all duration-300">
      <div className="flex justify-end pt-4 md:pt-6">
        <ThemeToggle />
      </div>
      <div
        className={`transition-all duration-300 ${
          isCompact
            ? "space-y-1 -mt-6 md:mt-0"
            : "space-y-4 -mt-6 md:mt-0"
        } mt-4`}
      >
        <div
          className={`inline-flex items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 rotate-3 transition-all duration-300 ${
            isCompact
              ? "h-0 w-0 opacity-0 -translate-y-2"
              : "h-16 w-16 opacity-100 translate-y-0 hover:rotate-0"
          }`}
        >
          <Trophy className="h-8 w-8 text-white" />
        </div>
        <div className={isCompact ? "space-y-0" : "space-y-1"}>
          <h1
            className={`font-black tracking-tight text-foreground transition-all duration-300 ${
              isCompact
                ? "text-3xl md:text-4xl"
                : "text-4xl md:text-5xl"
            }`}
          >
            Rodízio<span className="text-primary">Race</span>
          </h1>
          <p
            className={`text-muted-foreground font-medium uppercase tracking-widest text-xs transition-all duration-300 ${
              isCompact ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
            }`}
          >
            A elite da comilança competitiva
          </p>
        </div>
      </div>
    </div>
  );
}

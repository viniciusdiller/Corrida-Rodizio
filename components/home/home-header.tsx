import { Trophy } from "lucide-react";

export function HomeHeader() {
  return (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-300">
        <Trophy className="h-8 w-8 text-white" />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          Rodízio<span className="text-primary">Race</span>
        </h1>
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">
          A elite da comilança competitiva
        </p>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface StartActionsProps {
  onSetFlow: (flow: "create" | "join") => void;
}

export function StartActions({ onSetFlow }: StartActionsProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <Button
        size="lg"
        className="w-full h-14 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 transition-all hover:translate-y-0.5px active:scale-95"
        onClick={() => onSetFlow("create")}
      >
        {t.home.create_race}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
      <Button
        variant="outline"
        className="w-full h-14 rounded-xl font-semibold text-muted-foreground hover:text-primary border-muted"
        onClick={() => onSetFlow("join")}
      >
        {t.home.join_race}
      </Button>
    </div>
  );
}

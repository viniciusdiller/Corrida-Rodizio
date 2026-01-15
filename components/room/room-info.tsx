import { Check, Copy, Users } from "lucide-react";
import { FoodIcon } from "@/components/food-icon";
import { Button } from "@/components/ui/button";
import { Race } from "@/types/database";

interface RoomInfoProps {
  race: Race;
  participantsCount: number;
  roomCode: string;
  copied: boolean;
  onCopyCode: () => void;
}

export function RoomInfo({
  race,
  participantsCount,
  roomCode,
  copied,
  onCopyCode,
}: RoomInfoProps) {
  return (
    <div className="space-y-2 py-2 sm:space-y-3 sm:py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-card shadow-xl border border-muted sm:w-20 sm:h-20 sm:rounded-3xl">
            <FoodIcon
              type={race.food_type}
              className="h-7 w-7 text-primary sm:h-10 sm:w-10"
            />
          </div>
          <div className="space-y-0 sm:space-y-0.5">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary sm:text-xs sm:tracking-[0.3em]">
              Competição de
            </h2>
            <h1 className="text-3xl font-black capitalize sm:text-4xl">
              {race.food_type === "sushi" ? "Rodízio Japa" : race.food_type}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-muted/60 bg-background/60 px-3 py-2 shadow-sm">
          <div className="text-right leading-none">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Sala
            </p>
            <p className="font-mono font-bold text-lg leading-none">
              {roomCode}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onCopyCode}
            className="h-9 w-9 rounded-xl border border-muted/50 bg-background/80"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:gap-3 sm:text-xs">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> {participantsCount} Jogadores
        </span>
        <span className="w-1 h-1 bg-muted rounded-full" />
        <span className="text-primary animate-pulse">● Ao Vivo</span>
      </div>
    </div>
  );
}

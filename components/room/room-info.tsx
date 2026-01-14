import { Users } from "lucide-react";
import { FoodIcon } from "@/components/food-icon";
import { Race } from "@/types/database";

interface RoomInfoProps {
  race: Race;
  participantsCount: number;
}

export function RoomInfo({ race, participantsCount }: RoomInfoProps) {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-card shadow-xl border border-muted mb-2">
        <FoodIcon type={race.food_type} className="h-10 w-10 text-primary" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary">
          Competição de
        </h2>
        <h1 className="text-4xl font-black capitalize">
          {race.food_type === "sushi" ? "Rodízio Japa" : race.food_type}
        </h1>
      </div>
      <div className="flex items-center justify-center gap-4 text-muted-foreground font-bold text-xs uppercase tracking-widest">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> {participantsCount} Jogadores
        </span>
        <span className="w-1 h-1 bg-muted rounded-full" />
        <span className="text-primary animate-pulse">● Ao Vivo</span>
      </div>
    </div>
  );
}

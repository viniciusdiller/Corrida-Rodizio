import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users2, ArrowRight } from "lucide-react";
import { FoodType } from "@/types/database";

interface CreateRaceFormProps {
  playerName: string;
  setPlayerName: (val: string) => void;
  loginCode?: string | null;
  isTeamMode: boolean;
  setIsTeamMode: (val: boolean) => void;
  selectedFood: FoodType | null;
  setSelectedFood: (val: FoodType) => void;
  foodTypes: any[];
  loading: boolean;
  onCreate: () => void;
  onBack: () => void;
}

export function CreateRaceForm({
  playerName,
  setPlayerName,
  loginCode,
  isTeamMode,
  setIsTeamMode,
  selectedFood,
  setSelectedFood,
  foodTypes,
  loading,
  onCreate,
  onBack,
}: CreateRaceFormProps) {
  const isNameRequired = !loginCode;
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      {isNameRequired ? (
        <div className="space-y-3">
          <Label
            htmlFor="playerName"
            className="text-xs uppercase font-bold text-muted-foreground px-1"
          >
            Seu Codinome
          </Label>
          <Input
            id="playerName"
            placeholder="Ex: Predador de Pizza"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="bg-background/50 h-14 text-lg font-medium"
          />
        </div>
      ) : (
        <div className="space-y-2 rounded-2xl border border-muted/60 bg-background/60 px-4 py-3">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Entrando como
          </Label>
          <p className="text-lg font-black tracking-wider">{loginCode}</p>
        </div>
      )}

      <div
        onClick={() => setIsTeamMode(!isTeamMode)}
        className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
          isTeamMode
            ? "bg-primary/5 border-primary/20 shadow-inner"
            : "bg-background border-muted"
        }`}
      >
        <div className="flex items-center gap-3">
          <Users2
            className={`h-5 w-5 ${
              isTeamMode ? "text-primary" : "text-muted-foreground"
            }`}
          />
          <div className="text-left">
            <p className="text-sm font-bold">Modo Equipes</p>
            <p className="text-[10px] text-muted-foreground uppercase">
              Disputa Coletiva
            </p>
          </div>
        </div>
        <div
          className={`w-10 h-6 rounded-full relative ${
            isTeamMode ? "bg-primary" : "bg-muted"
          }`}
        >
          <div
            className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all ${
              isTeamMode ? "left-5" : "left-1"
            }`}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-xs uppercase font-bold text-muted-foreground px-1">
          Escolha a Categoria
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {foodTypes.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setSelectedFood(type)}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all ${
                selectedFood === type
                  ? "bg-primary text-white shadow-lg scale-105"
                  : "bg-background text-muted-foreground border border-transparent hover:border-primary/20"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-black uppercase tracking-tighter">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 space-y-4">
        <Button
          size="lg"
          className="w-full h-14 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 cursor-pointer"
          onClick={onCreate}
          disabled={
            (isNameRequired && !playerName.trim()) || !selectedFood || loading
          }
        >
          {loading ? "Preparando Mesa..." : "Criar Competição"}{" "}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground cursor-pointer"
          onClick={onBack}
        >
          Voltar
        </Button>
      </div>
    </div>
  );
}

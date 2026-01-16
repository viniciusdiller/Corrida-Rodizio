import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hash, ArrowRight } from "lucide-react";

interface JoinRaceFormProps {
  playerName: string;
  setPlayerName: (val: string) => void;
  roomCode: string;
  setRoomCode: (val: string) => void;
  loginCode?: string | null;
  loading: boolean;
  onJoin: () => void;
  onBack: () => void;
}

export function JoinRaceForm({
  playerName,
  setPlayerName,
  roomCode,
  setRoomCode,
  loginCode,
  loading,
  onJoin,
  onBack,
}: JoinRaceFormProps) {
  const hasName = !!playerName.trim();
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
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
      <div className="space-y-3">
        <Label
          htmlFor="roomCode"
          className="text-xs uppercase font-bold text-muted-foreground px-1"
        >
          Código da Arena
        </Label>
        <div className="relative">
          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="roomCode"
            placeholder="ABCDE"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="pl-12 h-14 text-2xl font-black uppercase border-primary/20"
            maxLength={5}
          />
        </div>
      </div>
      <div className="space-y-3">
        <Button
          className="w-full h-14 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 cursor-pointer"
          onClick={onJoin}
          disabled={!hasName || !roomCode.trim() || loading}
        >
          {loading ? "Localizando..." : "Entrar na Arena"}{" "}
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

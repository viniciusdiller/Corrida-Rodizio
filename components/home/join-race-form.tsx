import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hash, ArrowRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface JoinRaceFormProps {
  playerName: string;
  setPlayerName: (val: string) => void;
  roomCode: string;
  setRoomCode: (val: string) => void;
  loading: boolean;
  isSpectator: boolean;
  setIsSpectator: (val: boolean) => void;
  onJoin: () => void;
  onBack: () => void;
}

export function JoinRaceForm({
  playerName,
  setPlayerName,
  roomCode,
  setRoomCode,
  loading,
  isSpectator,
  setIsSpectator,
  onJoin,
  onBack,
}: JoinRaceFormProps) {
  const { t } = useLanguage();
  const hasName = isSpectator || !!playerName.trim();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
      <button
        type="button"
        onClick={() => setIsSpectator(!isSpectator)}
        className={`flex items-center justify-between w-full p-4 rounded-xl border transition-all ${
          isSpectator
            ? "bg-primary/5 border-primary/20 shadow-inner"
            : "bg-background border-muted"
        }`}
      >
        <div className="text-left">
          <p className="text-sm font-bold">{t.home.enter_spectator}</p>
          <p className="text-[10px] text-muted-foreground uppercase">
            {t.home.spectator_desc}
          </p>
        </div>
        <div
          className={`w-10 h-6 rounded-full relative ${
            isSpectator ? "bg-primary" : "bg-muted"
          }`}
        >
          <div
            className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all ${
              isSpectator ? "left-5" : "left-1"
            }`}
          />
        </div>
      </button>

      {!isSpectator && (
        <div className="space-y-3">
          <Label
            htmlFor="playerName"
            className="text-xs uppercase font-bold text-muted-foreground px-1"
          >
            {t.home.codename_label}
          </Label>
          <Input
            id="playerName"
            placeholder={t.home.codename_placeholder}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="bg-background/50 h-14 text-lg font-medium"
          />
        </div>
      )}
      <div className="space-y-3">
        <Label
          htmlFor="roomCode"
          className="text-xs uppercase font-bold text-muted-foreground px-1"
        >
          {t.home.room_code_label}
        </Label>
        <div className="relative">
          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="roomCode"
            placeholder={t.home.room_code_placeholder}
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
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t.home.locating}
            </>
          ) : (
            <>
              {t.home.enter_arena} <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground cursor-pointer"
          onClick={onBack}
        >
          {t.common.back}
        </Button>
      </div>
    </div>
  );
}

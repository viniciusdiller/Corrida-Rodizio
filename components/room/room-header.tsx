"use client";

import { ArrowLeft, Flag, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoomHeaderProps {
  roomCode: string;
  canEndRace: boolean;
  isEnding: boolean;
  copied: boolean;
  onExit: () => void;
  onEndRace: () => void; // Esta função vem da página pai
  onCopyCode: () => void;
}

export function RoomHeader({
  roomCode,
  canEndRace,
  isEnding,
  copied,
  onExit,
  onEndRace,
  onCopyCode,
}: RoomHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        onClick={onExit}
        className="text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Sair
      </Button>

      {canEndRace && (
        <Button
          variant="destructive"
          size="sm"
          className="rounded-xl font-bold gap-2 shadow-lg shadow-destructive/20 cursor-pointer transition-all hover:scale-105"
          onClick={onEndRace}
          disabled={isEnding}
        >
          <Flag className="h-4 w-4" />{" "}
          {isEnding ? "Encerrando..." : "Encerrar Competição"}
        </Button>
      )}

      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Sala
          </p>
          <p className="font-mono font-bold text-lg leading-none">{roomCode}</p>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={onCopyCode}
          className="h-10 w-10 rounded-xl"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { Participant } from "@/types/database";
import { Card } from "@/components/ui/card";
import { getAvatarUrl, isImageAvatar } from "@/lib/utils/avatars";
import { Trophy, Timer } from "lucide-react";

// Mapeamento de cores para manter a consistencia com o restante do app
const TEAM_COLORS: Record<string, string> = {
  AZUL: "border-blue-500/50 text-blue-400 bg-blue-500/10",
  VERMELHA: "border-red-500/50 text-red-400 bg-red-500/10",
  VERDE: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
  AMARELA: "border-yellow-500/50 text-yellow-400 bg-yellow-500/10",
};

interface RaceTrackProps {
  participants: Participant[];
  isTeamMode: boolean; // Adicionado para ativar o visual de times
}

export function RaceTrack({ participants, isTeamMode }: RaceTrackProps) {
  const maxScore = Math.max(...participants.map((p) => p.items_eaten), 1);

  const sortedByEntry = [...participants].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="space-y-3 w-full overflow-hidden">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-primary font-black uppercase text-[9px] tracking-widest">
          <Timer className="h-3 w-3" />
          Corrida em Tempo Real - Live Race
        </div>
        <div className="text-[9px] font-bold text-muted-foreground uppercase bg-muted/50 px-2 py-0.5 rounded-full">
          Lider: {maxScore}
        </div>
      </div>

      <Card className="relative overflow-hidden border-none shadow-xl bg-[#1a1a1a]">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_8px,#fff_8px,#fff_16px)] opacity-30" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_8px,#fff_8px,#fff_16px)] opacity-30" />

        {/* pr-12 para garantir que o texto nao corte no final da pista */}
        <div className="py-6 pl-2 pr-12 space-y-1 relative min-h-[160px] bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:15px_15px]">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-white/10" />

          <div
            className="absolute right-0 top-0 bottom-0 w-8 md:w-12 opacity-20"
            style={{
              backgroundImage: `conic-gradient(#fff 0.25turn, #000 0.25turn 0.5turn, #fff 0.5turn 0.75turn, #000 0.75turn)`,
              backgroundSize: "12px 12px",
            }}
          />

          {sortedByEntry.map((participant) => {
            const progress = (participant.items_eaten / maxScore) * 100;
            const isLeader =
              participant.items_eaten === maxScore && maxScore > 0;

            // Define o estilo baseado no time
            const teamStyle =
              isTeamMode && participant.team
                ? TEAM_COLORS[participant.team as keyof typeof TEAM_COLORS]
                : "border-white/5 bg-[#1a1a1a]/80 text-white";

            return (
              <div
                key={participant.id}
                className="relative h-12 flex items-center"
              >
                <div className="absolute bottom-0 left-2 right-2 h-px bg-white/5" />

                <div
                  className="absolute transition-all duration-1000 ease-in-out flex items-center gap-1"
                  style={{
                    left: `${progress}%`,
                    transform: `translateX(-${progress}%)`,
                    zIndex: isLeader ? 20 : 10,
                  }}
                >
                  {/* Caixa de informacoes com a cor do time */}
                  <div className="flex flex-col min-w-[64px] p-1 text-right text-white">
                    <span className="text-[9px] font-black uppercase leading-none truncate max-w-[80px] md:max-w-[120px]">
                      <span className="inline-flex items-center justify-end gap-1">
                        {isLeader && (
                          <Trophy className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        )}
                        {participant.name.split(" ")[0]}
                      </span>
                    </span>
                    <span
                      className={`text-[12px] font-black italic leading-tight ${
                        isTeamMode ? "" : "text-primary"
                      }`}
                    >
                      {participant.items_eaten}pts
                    </span>
                  </div>
                  <div className="relative shrink-0 w-14 h-14 md:w-16 md:h-16 flex items-center justify-center">
                    {isImageAvatar(participant.avatar) ? (
                      <img
                        src={getAvatarUrl(participant.avatar)}
                        alt=""
                        className="h-11 w-11 md:h-14 md:w-14 object-contain"
                      />
                    ) : (
                      <span className="inline-block h-11 w-11 rounded-full bg-white/10 md:h-14 md:w-14" />
                    )}
                    {/* Pequeno indicador de cor acima do avatar (opcional) */}
                    {isTeamMode && participant.team && (
                      <div
                        className={`absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full border border-black/50 ${TEAM_COLORS[
                          participant.team
                        ]
                          .split(" ")
                          .pop()}`}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex justify-between px-2 opacity-30 text-[8px] font-bold uppercase">
        <span>Largada</span>
        <span>Chegada</span>
      </div>
    </div>
  );
}

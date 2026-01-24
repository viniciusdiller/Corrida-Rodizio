"use client";

import { Trophy, Instagram, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Race, Participant } from "@/types/database";
import { getAvatarUrl, isImageAvatar } from "@/lib/utils/avatars";

// Constantes movidas para o componente para facilitar a organização
const MOTIVATIONAL_PHRASES = [
  "O importante é que a barriga está cheia!",
  "Na próxima você pede reforço!",
  "Faltou um espacinho para a sobremesa?",
  "O estômago é o limite, mas hoje você parou antes!",
  "O vice-campeão também ganha... a conta!",
  "Treino é treino, rodízio é jogo!",
  "Guerreiro(a), mas o estômago não ajudou!",
  "A vitória escapou, mas a conta chegou igual!",
  "Hoje o campeão foi o garçom!",
  "Faltou gás no final, mas o começo foi histórico!",
  "Seu estômago entrou em modo economia de energia!",
  "A competição acabou, a digestão começou!",
  "Não foi derrota, foi estratégia de sobrevivência!",
  "Seu limite foi atingido antes do garçom!",
  "O campeão come mais, mas você comeu bem!",
  "Derrota honrosa: saiu andando, não rolando!",
];

const TEAM_OPTIONS = [
  { id: "AZUL", shortLabel: "Azul", pillClass: "bg-blue-500/20 text-blue-300" },
  {
    id: "VERMELHA",
    shortLabel: "Vermelho",
    pillClass: "bg-red-500/20 text-red-300",
  },
  {
    id: "VERDE",
    shortLabel: "Verde",
    pillClass: "bg-emerald-500/20 text-emerald-300",
  },
  {
    id: "AMARELA",
    shortLabel: "Amarelo",
    pillClass: "bg-yellow-500/20 text-yellow-300",
  },
];

interface HallOfFameProps {
  race: Race;
  participants: Participant[];
  maxScore: number;
  getItemLabel: (count: number) => string;
  onHome: () => void;
}

export function HallOfFame({
  race,
  participants,
  maxScore,
  getItemLabel,
  onHome,
}: HallOfFameProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center animate-in fade-in duration-1000">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-block p-3 bg-orange-500 rounded-2xl rotate-3 shadow-2xl shadow-orange-500/20">
            <Trophy className="h-10 w-10 text-zinc-950" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">
              Hall of Fame
            </h1>
            <p className="text-orange-500 font-mono text-sm tracking-widest">
              SALA: {race.room_code}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {participants.map((p, i) => {
            const isWinner = p.items_eaten === maxScore && maxScore > 0;
            const team = TEAM_OPTIONS.find((t) => t.id === p.team);
            return (
              <div
                key={p.id}
                className={`relative overflow-hidden flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${
                  isWinner
                    ? "border-orange-500 bg-orange-500/10 scale-105 shadow-[0_0_30px_rgba(249,115,22,0.2)]"
                    : "border-white/5 bg-white/5"
                }`}
              >
                <div className="flex items-center gap-4 z-10">
                  <div className="text-3xl">
                    {isImageAvatar(p.avatar) ? (
                      <img
                        src={getAvatarUrl(p.avatar)}
                        alt=""
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <span className="inline-block h-9 w-9 rounded-full bg-white/10" />
                    )}
                  </div>
                  <span
                    className={`text-2xl font-black ${
                      isWinner ? "text-orange-500" : "text-zinc-700"
                    }`}
                  >
                    #{i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-xl leading-tight flex items-center gap-2">
                      {p.name}
                      {race.is_team_mode && team && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${team.pillClass}`}
                        >
                          {team.shortLabel}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                      {isWinner
                        ? "🏆 Lendário Comilão"
                        : MOTIVATIONAL_PHRASES[i % MOTIVATIONAL_PHRASES.length]}
                    </p>
                  </div>
                </div>
                <div className="text-right z-10">
                  <p className="text-3xl font-black leading-none">
                    {p.items_eaten}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-zinc-500 mt-1">
                    {getItemLabel(p.items_eaten)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-6 pt-4">
          <div className="flex items-center gap-2 text-zinc-500 animate-bounce">
            <Instagram className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Print & Post
            </span>
          </div>
          <Button
            variant="outline"
            className="w-full rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
            onClick={onHome}
          >
            <Home className="h-4 w-4 mr-2" /> Início
          </Button>
        </div>
      </div>
    </div>
  );
}

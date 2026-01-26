"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sword, TrendingUp } from "lucide-react";
import { Race, Participant } from "@/types/database";
import { getAvatarUrl, isImageAvatar } from "@/lib/utils/avatars";
import { useLanguage } from "@/contexts/language-context";

interface RankingSectionProps {
  race: Race;
  participants: Participant[];
  currentParticipantId: string | null;
  getItemLabel: (count: number) => string;
}

export function RankingSection({
  race,
  participants,
  currentParticipantId,
}: RankingSectionProps) {
  const { t } = useLanguage();

  if (participants.length <= 1) return null;

  if (!race.is_team_mode) return null;

  const totalScore = participants.reduce((acc, p) => acc + p.items_eaten, 0);

  const TEAM_CONFIG = {
    AZUL: {
      label: t.room.team_blue,
      color: "bg-blue-500",
      text: "text-blue-500",
      border: "border-l-blue-500",
      bg: "bg-blue-500/5",
    },
    VERMELHA: {
      label: t.room.team_red,
      color: "bg-red-500",
      text: "text-red-500",
      border: "border-l-red-500",
      bg: "bg-red-500/5",
    },
    VERDE: {
      label: t.room.team_green,
      color: "bg-emerald-500",
      text: "text-emerald-400",
      border: "border-l-emerald-500",
      bg: "bg-emerald-500/5",
    },
    AMARELA: {
      label: t.room.team_yellow,
      color: "bg-yellow-500",
      text: "text-yellow-400",
      border: "border-l-yellow-500",
      bg: "bg-yellow-500/5",
    },
  };

  return (
    <div className="space-y-6">
      {/* CABO DE GUERRA MULTI-EQUIPAS */}
      <div className="space-y-2 px-1">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <span>{t.room.team_dispute}</span>
          <span>{totalScore} Total</span>
        </div>
        <div className="h-4 w-full flex rounded-full overflow-hidden bg-muted/20 border border-white/5 shadow-inner">
          {Object.entries(TEAM_CONFIG).map(([id, config]) => {
            const teamPoints = participants
              .filter((p) => p.team === id)
              .reduce((acc, p) => acc + p.items_eaten, 0);
            const width = totalScore > 0 ? (teamPoints / totalScore) * 100 : 0;
            return width > 0 ? (
              <div
                key={id}
                className={`h-full transition-all duration-1000 ${config.color}`}
                style={{ width: `${width}%` }}
              />
            ) : null;
          })}
        </div>
      </div>

      {/* CARTÕES DAS EQUIPAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(TEAM_CONFIG).map(([id, config]) => {
          const members = participants
            .filter((p) => p.team === id)
            .sort((a, b) => b.items_eaten - a.items_eaten);
          const teamTotal = members.reduce((acc, p) => acc + p.items_eaten, 0);
          const average =
            members.length > 0 ? (teamTotal / members.length).toFixed(1) : "0";

          return (
            <Card
              key={id}
              className={`border-none border-l-4 ${config.border} ${config.bg} shadow-md overflow-hidden`}
            >
              <CardContent className="p-3 space-y-3">
                <div className="flex justify-between items-center">
                  <div className={`flex items-center gap-1.5 ${config.text}`}>
                    <Sword className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase">
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-[9px] font-bold tracking-tighter">
                        {t.room.team_avg} {average}
                      </span>
                    </div>
                    <span className="text-xs font-black">{teamTotal}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between bg-background/50 rounded-lg px-2 py-1.5 border border-white/5"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {isImageAvatar(m.avatar) ? (
                          <img
                            src={getAvatarUrl(m.avatar)}
                            alt=""
                            className="h-5 w-5 object-contain shrink-0"
                          />
                        ) : (
                          <span className="inline-block h-4 w-4 rounded-full bg-muted/40 shrink-0" />
                        )}
                        <span
                          className={`text-[11px] font-bold truncate ${
                            m.id === currentParticipantId ? "text-primary" : ""
                          }`}
                        >
                          {m.name.split(" ")[0]}
                        </span>
                      </div>
                      <span className="text-[11px] font-black opacity-60">
                        {m.items_eaten}
                      </span>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <p className="text-[9px] text-center text-muted-foreground italic py-2">
                      {t.room.no_players}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

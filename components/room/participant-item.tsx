"use client";

import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Participant, FoodType } from "@/types/database";
import { getAvatarUrl, isImageAvatar } from "@/lib/utils/avatars";

// Opções de equipa para classes CSS
const TEAM_OPTIONS = {
  AZUL: { badgeClass: "border-blue-500/40 text-blue-500", shortLabel: "Azul" },
  VERMELHA: {
    badgeClass: "border-red-500/40 text-red-500",
    shortLabel: "Vermelho",
  },
  VERDE: {
    badgeClass: "border-emerald-500/40 text-emerald-400",
    shortLabel: "Verde",
  },
  AMARELA: {
    badgeClass: "border-yellow-500/40 text-yellow-400",
    shortLabel: "Amarelo",
  },
};

interface ParticipantItemProps {
  participant: Participant;
  index: number;
  is_team_mode: boolean;
  isPersonal?: boolean;
  getItemLabel: (count: number) => string;
}

export function ParticipantItem({
  participant,
  index,
  is_team_mode,
  isPersonal,
  getItemLabel,
}: ParticipantItemProps) {
  const isLeader = index === 0 && participant.items_eaten > 0;
  const team = participant.team
    ? TEAM_OPTIONS[participant.team as keyof typeof TEAM_OPTIONS]
    : null;

  return (
    <Card
      className={`overflow-hidden border-none transition-all duration-300 ${
        isPersonal
          ? "ring-2 ring-primary shadow-xl scale-[1.02]"
          : "shadow-md bg-card/60"
      } ${
        isLeader ? "bg-gradient-to-r from-yellow-500/5 to-orange-500/5" : ""
      }`}
    >
      <CardContent className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-xl font-black ${
                isLeader
                  ? "bg-yellow-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isLeader ? <Trophy className="h-4 w-4" /> : index + 1}
            </div>
            <div className="text-2xl">
              {isImageAvatar(participant.avatar) ? (
                <img
                  src={getAvatarUrl(participant.avatar)}
                  alt=""
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <span className="inline-block h-7 w-7 rounded-full bg-muted/40" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">{participant.name}</span>
                {participant.is_vip && (
                  <Badge className="bg-yellow-500/20 text-yellow-600 border-none text-[9px] h-4">
                    VIP
                  </Badge>
                )}
                {is_team_mode && team && (
                  <Badge
                    variant="outline"
                    className={`text-[9px] h-4 px-1.5 ${team.badgeClass}`}
                  >
                    {team.shortLabel}
                  </Badge>
                )}
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase">
                {participant.items_eaten}{" "}
                {getItemLabel(participant.items_eaten)}
              </p>
            </div>
          </div>
          <div className="text-2xl font-black text-muted-foreground/30 pr-1">
            {participant.items_eaten}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

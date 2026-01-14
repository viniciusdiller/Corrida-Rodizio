"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trophy, Sword } from "lucide-react";
import { ParticipantItem } from "./participant-item";
import { Race, Participant } from "@/types/database";

const TEAM_CONFIG = [
  {
    id: "AZUL",
    label: "Time Azul",
    cardClass: "border-l-4 border-l-blue-500 bg-blue-500/5",
    scoreClass: "text-blue-500",
  },
  {
    id: "VERMELHA",
    label: "Time Vermelho",
    cardClass: "border-l-4 border-l-red-500 bg-red-500/5",
    scoreClass: "text-red-500",
  },
  {
    id: "VERDE",
    label: "Time Verde",
    cardClass: "border-l-4 border-l-emerald-500 bg-emerald-500/5",
    scoreClass: "text-emerald-400",
  },
  {
    id: "AMARELA",
    label: "Time Amarelo",
    cardClass: "border-l-4 border-l-yellow-500 bg-yellow-500/5",
    scoreClass: "text-yellow-400",
  },
];

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
  getItemLabel,
}: RankingSectionProps) {
  if (participants.length <= 1) {
    return (
      <div className="py-12 text-center bg-card/40 rounded-3xl border border-dashed border-muted">
        <p className="text-sm font-medium text-muted-foreground italic">
          Aguardando rivais entrarem...
        </p>
      </div>
    );
  }

  if (race.is_team_mode) {
    return (
      <div className="space-y-4">
        {TEAM_CONFIG.map((team) => {
          const members = participants
            .filter((p) => p.team === team.id)
            .sort((a, b) => b.items_eaten - a.items_eaten);
          const total = members.reduce((acc, p) => acc + p.items_eaten, 0);
          const topScore = members[0]?.items_eaten ?? 0;

          return (
            <Card
              key={team.id}
              className={`overflow-hidden border-none shadow-md ${team.cardClass}`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${team.scoreClass}`}>
                    <Sword className="h-4 w-4" />
                    <span className="text-[11px] font-black uppercase tracking-widest">
                      {team.label}
                    </span>
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                    Total {total}
                  </span>
                </div>
                <div className="space-y-2">
                  {members.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-muted/60 p-4 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Sem jogadores
                    </div>
                  ) : (
                    members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-2xl bg-background/70 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{member.avatar}</span>
                          <span className="text-sm font-semibold">
                            {member.name}
                          </span>
                          {member.id === currentParticipantId && (
                            <Badge className="bg-primary/10 text-primary border-none text-[9px] h-4 uppercase">
                              Você
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-black">
                          {member.items_eaten}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {participants.map((p, i) => (
        <ParticipantItem
          key={p.id}
          participant={p}
          index={i}
          is_team_mode={false}
          isPersonal={p.id === currentParticipantId}
          getItemLabel={getItemLabel}
        />
      ))}
    </div>
  );
}

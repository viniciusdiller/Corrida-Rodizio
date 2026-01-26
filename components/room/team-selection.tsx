"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

interface TeamSelectionProps {
  onUpdateTeam: (teamId: string) => void;
  isUpdating: boolean;
}

export function TeamSelection({
  onUpdateTeam,
  isUpdating,
}: TeamSelectionProps) {
  const { t } = useLanguage();

  const TEAMS = [
    {
      id: "AZUL",
      label: t.room.team_blue,
      class: "border-blue-500 text-blue-500",
    },
    {
      id: "VERMELHA",
      label: t.room.team_red,
      class: "border-red-500 text-red-500",
    },
    {
      id: "VERDE",
      label: t.room.team_green,
      class: "border-emerald-500 text-emerald-500",
    },
    {
      id: "AMARELA",
      label: t.room.team_yellow,
      class: "border-yellow-500 text-yellow-500",
    },
  ];

  return (
    <Card className="border-none shadow-lg bg-card/70">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-1">
          <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
            {t.room.choose_team}
          </Label>
          <p className="text-sm font-medium text-muted-foreground">
            {t.room.choose_team_desc}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TEAMS.map((team) => (
            <Button
              key={team.id}
              variant="outline"
              className={`h-11 rounded-xl font-bold ${team.class}`}
              onClick={() => onUpdateTeam(team.id)}
              disabled={isUpdating}
            >
              {team.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

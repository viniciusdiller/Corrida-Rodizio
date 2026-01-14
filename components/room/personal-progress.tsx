"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AVATAR_OPTIONS } from "@/lib/utils/avatars";
import { Participant } from "@/types/database";

interface PersonalProgressProps {
  participant: Participant;
  getItemLabel: (count: number) => string;
  onUpdateCount: (id: string, change: number) => void;
  onUpdateAvatar: (avatar: string) => void;
  isUpdatingAvatar: boolean;
}

export function PersonalProgress({
  participant,
  getItemLabel,
  onUpdateCount,
  onUpdateAvatar,
  isUpdatingAvatar,
}: PersonalProgressProps) {
  return (
    <div className="space-y-4">
      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">
        Seu Progresso
      </Label>
      <Card className="ring-2 ring-primary shadow-xl scale-[1.02] border-none bg-card/80 backdrop-blur-sm">
        <CardContent className="px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl animate-in zoom-in duration-300">
                {participant.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">
                    {participant.name}
                  </span>
                  {participant.is_vip && (
                    <Badge className="bg-yellow-500/20 text-yellow-600 border-none text-[9px] h-4 uppercase font-black">
                      VIP
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground uppercase font-medium">
                  {participant.items_eaten}{" "}
                  {getItemLabel(participant.items_eaten)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-background/50 p-1 rounded-2xl border border-muted/40">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => onUpdateCount(participant.id, -1)}
                disabled={participant.items_eaten === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="w-10 text-center text-xl font-black">
                {participant.items_eaten}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => onUpdateCount(participant.id, 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="pt-4 border-t border-muted/40 space-y-3">
            <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Trocar seu ícone
            </Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  disabled={isUpdatingAvatar}
                  onClick={() => onUpdateAvatar(opt)}
                  className={`w-10 h-10 rounded-xl border transition-all text-xl flex items-center justify-center cursor-pointer ${
                    participant.avatar === opt
                      ? "border-primary bg-primary/20 scale-110 shadow-lg"
                      : "hover:border-primary/40 bg-background/40 hover:bg-background/60"
                  } ${isUpdatingAvatar ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

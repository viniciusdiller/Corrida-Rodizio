"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getAvatarUrl,
  isImageAvatar,
} from "@/lib/utils/avatars";
import { Participant } from "@/types/database";

interface PersonalProgressProps {
  participant: Participant;
  getItemLabel: (count: number) => string;
  onUpdateCount: (
    id: string,
    change: number,
    event?: MouseEvent<HTMLButtonElement>
  ) => void;
  onUpdateAvatar: (avatar: string) => void;
  isUpdatingAvatar: boolean;
  isAddCooldown: boolean;
}

export function PersonalProgress({
  participant,
  getItemLabel,
  onUpdateCount,
  onUpdateAvatar,
  isUpdatingAvatar,
  isAddCooldown,
}: PersonalProgressProps) {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarOptions, setAvatarOptions] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadAvatars = async () => {
      try {
        const response = await fetch("/api/avatars");
        if (!response.ok) return;
        const data = await response.json();
        const list = Array.isArray(data?.avatars) ? data.avatars : [];
        if (list.length === 0) return;
        if (isMounted) setAvatarOptions(list);
      } catch {
        return;
      }
    };

    loadAvatars();
    return () => {
      isMounted = false;
    };
  }, []);

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
                {isImageAvatar(participant.avatar) ? (
                  <img
                    src={getAvatarUrl(participant.avatar)}
                    alt=""
                    className="h-12 w-12 object-contain"
                  />
                ) : (
                  <span className="inline-block h-10 w-10 rounded-full bg-muted/40" />
                )}
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
                onClick={(event) =>
                  onUpdateCount(participant.id, -1, event)
                }
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
                className={`h-8 w-8 cursor-pointer ${
                  isAddCooldown ? "opacity-50 grayscale" : ""
                }`}
                onClick={(event) =>
                  onUpdateCount(participant.id, 1, event)
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="pt-4 border-t border-muted/40 space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl text-xs font-black uppercase tracking-[0.2em]"
              onClick={() => setShowAvatarPicker((prev) => !prev)}
              disabled={isUpdatingAvatar}
            >
              Trocar seu Avatar
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showAvatarPicker ? "rotate-180" : ""
                }`}
              />
            </Button>
            {showAvatarPicker && (
              <div className="flex flex-wrap gap-2">
                {avatarOptions.map((opt) => (
                  <button
                    key={opt}
                    disabled={isUpdatingAvatar}
                    onClick={() => {
                      onUpdateAvatar(opt);
                      setShowAvatarPicker(false);
                    }}
                    className={`w-10 h-10 rounded-xl border transition-all text-xl flex items-center justify-center cursor-pointer ${
                      participant.avatar === opt
                        ? "border-primary bg-primary/20 scale-110 shadow-lg"
                        : "hover:border-primary/40 bg-background/40 hover:bg-background/60"
                    } ${
                      isUpdatingAvatar ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isImageAvatar(opt) && (
                      <img
                        src={getAvatarUrl(opt)}
                        alt=""
                        className="h-7 w-7 object-contain"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

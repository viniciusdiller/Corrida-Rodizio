"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getAvatarUrl,
  isExclusiveAvatar,
  isImageAvatar,
  isPremiumAvatar,
} from "@/lib/utils/avatars";
import { Participant } from "@/types/database";
import { useLanguage } from "@/contexts/language-context";

interface PersonalProgressProps {
  participant: Participant;
  getItemLabel: (count: number) => string;
  onUpdateCount: (
    id: string,
    change: number,
    event?: MouseEvent<HTMLButtonElement>,
  ) => void;
  onUpdateAvatar: (avatar: string) => void;
  isUpdatingAvatar: boolean;
  isAddCooldown: boolean;
  isPremium: boolean;
  exclusiveAvatars: string[];
}

export function PersonalProgress({
  participant,
  getItemLabel,
  onUpdateCount,
  onUpdateAvatar,
  isUpdatingAvatar,
  isAddCooldown,
  isPremium,
  exclusiveAvatars,
}: PersonalProgressProps) {
  const { t } = useLanguage();
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
        const filtered = list.filter((opt) => {
          if (opt === participant.avatar) return true;
          if (isExclusiveAvatar(opt)) return exclusiveAvatars.includes(opt);
          if (isPremiumAvatar(opt)) return isPremium;
          return true;
        });
        if (isMounted) setAvatarOptions(filtered);
      } catch {
        return;
      }
    };

    loadAvatars();
    return () => {
      isMounted = false;
    };
  }, [exclusiveAvatars, isPremium, participant.avatar]);

  return (
    <div className="space-y-2">
      <Label className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground px-1">
        {t.room.your_progress}
      </Label>
      <Card className="ring-1 ring-primary/40 shadow-lg border-none bg-card/80 backdrop-blur-sm">
        <CardContent className="px-3 py-0 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl animate-in zoom-in duration-300">
                {isImageAvatar(participant.avatar) ? (
                  <img
                    src={getAvatarUrl(participant.avatar)}
                    alt=""
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <span className="inline-block h-9 w-9 rounded-full bg-muted/40" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    {participant.name}
                  </span>
                  {participant.is_vip && (
                    <Badge className="bg-yellow-500/20 text-yellow-600 border-none text-[8px] h-4 uppercase font-black">
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
                className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive active:scale-75 transition-all duration-200 cursor-pointer"
                onClick={(event) => onUpdateCount(participant.id, -1, event)}
                disabled={participant.items_eaten === 0}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <div
                key={participant.items_eaten}
                className="w-8 text-center text-xl font-black text-primary drop-shadow-sm animate-in zoom-in-50 fade-in slide-in-from-bottom-1 duration-200"
              >
                {participant.items_eaten}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary active:scale-75 transition-all duration-200 cursor-pointer ${
                  isAddCooldown ? "opacity-50 grayscale" : ""
                }`}
                onClick={(event) => onUpdateCount(participant.id, 1, event)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="border-t border-muted/40 space-y-1 pt-2 pb-0">
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl text-[11px] font-black uppercase tracking-[0.18em] hover:cursor-pointer"
              onClick={() => setShowAvatarPicker((prev) => !prev)}
              disabled={isUpdatingAvatar}
            >
              {t.room.change_avatar}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  showAvatarPicker ? "rotate-180" : ""
                }`}
              />
            </Button>
            {showAvatarPicker && (
              <div className="flex flex-wrap gap-1.5">
                {avatarOptions.map((opt) => {
                  const isSelected = participant.avatar === opt;
                  const isPremiumOption = isPremiumAvatar(opt);
                  const isExclusiveOption = isExclusiveAvatar(opt);
                  const premiumBorderClass = isPremiumOption
                    ? "border-foreground/70 border-2"
                    : "";
                  const exclusiveBorderClass = isExclusiveOption
                    ? "border-purple-500 dark:border-primary border-2"
                    : "";

                  return (
                    <button
                      key={opt}
                      disabled={isUpdatingAvatar}
                      onClick={() => {
                        onUpdateAvatar(opt);
                        setShowAvatarPicker(false);
                      }}
                      className={`w-11 h-11 rounded-lg border transition-all text-xl flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? "ring-2 ring-primary bg-primary/20 scale-110 shadow-lg"
                          : "hover:border-primary/40 bg-background/40 hover:bg-background/60"
                      } ${premiumBorderClass} ${exclusiveBorderClass} ${
                        isUpdatingAvatar ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isImageAvatar(opt) && (
                        <img
                          src={getAvatarUrl(opt)}
                          alt=""
                          className="h-9 w-9 object-contain"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

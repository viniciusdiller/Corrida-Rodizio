"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { Minus, Plus, Camera, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  isUploadingPhoto: boolean;
  photoModeEnabled: boolean;
  photoRequired: boolean;
  onPhotoIncrement: (
    id: string,
    event?: MouseEvent<HTMLButtonElement>,
  ) => void;
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
  isUploadingPhoto,
  photoModeEnabled,
  photoRequired,
  onPhotoIncrement,
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
      <div className="flex flex-wrap items-center gap-2 px-1 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
        <span>{t.room.your_progress}</span>
        <span className="opacity-60">•</span>
        <span className="text-[10px] font-bold normal-case tracking-normal text-foreground break-words">
          {participant.name}
        </span>
        {participant.is_vip && (
          <Badge className="bg-yellow-500/20 text-yellow-700 border-none text-[8px] h-4 uppercase font-black">
            VIP
          </Badge>
        )}
        {isPremium && (
          <Badge className="bg-indigo-500/20 text-indigo-700 border-none text-[8px] h-4 uppercase font-black">
            Premium
          </Badge>
        )}
      </div>
      <Card className="ring-1 ring-primary/40 shadow-lg border-none bg-card/80 backdrop-blur-sm">
        <CardContent className="px-3 py-0 space-y-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAvatarPicker((prev) => !prev)}
              disabled={isUpdatingAvatar}
              className={`group relative h-12 w-12 animate-in zoom-in duration-300 rounded-2xl border border-dashed border-muted/50 bg-background/50 ring-1 ring-muted-foreground/20 transition hover:border-primary/40 hover:ring-primary/40 hover:bg-background/70 ${
                isUpdatingAvatar ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              }`}
              aria-label={t.room.change_avatar}
            >
              {isImageAvatar(participant.avatar) ? (
                <img
                  src={getAvatarUrl(participant.avatar)}
                  alt=""
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                <span className="inline-block h-full w-full rounded-2xl bg-muted/40" />
              )}
              <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border border-muted bg-background text-muted-foreground shadow-sm">
                <Pencil className="h-3 w-3" />
              </span>
            </button>
            <div className="flex flex-1 items-center gap-2">
              <div className="flex flex-1 items-center justify-center gap-1 rounded-2xl border border-primary/30 bg-primary/5 p-1 shadow-sm">
              {!photoRequired && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive active:scale-75 transition-all duration-200 cursor-pointer"
                  onClick={(event) => onUpdateCount(participant.id, -1, event)}
                  disabled={participant.items_eaten === 0}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
              )}
              <div
                key={participant.items_eaten}
                className="w-8 text-center text-xl font-black text-primary drop-shadow-sm animate-in zoom-in-50 fade-in slide-in-from-bottom-1 duration-200"
              >
                {participant.items_eaten}
              </div>
              {!photoRequired && (
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
              )}
              </div>
              {photoModeEnabled && (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-200/20 p-1 shadow-sm dark:bg-amber-900/20">
                  <Button
                    variant="ghost"
                    className={`h-7 rounded-full px-2 text-[10px] font-black uppercase tracking-wide text-amber-700 transition-all duration-200 hover:bg-amber-200/40 hover:text-amber-800 dark:text-amber-200 dark:hover:text-amber-100 ${
                      isAddCooldown || isUploadingPhoto
                        ? "opacity-50 grayscale"
                        : ""
                    }`}
                    onClick={(event) => onPhotoIncrement(participant.id, event)}
                    disabled={isUploadingPhoto}
                  >
                    <Camera className="mr-1 h-3.5 w-3.5" />
                    +1
                  </Button>
                </div>
              )}
            </div>
          </div>

          {showAvatarPicker && (
            <div className="border-t border-muted/40 pt-2 pb-0">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

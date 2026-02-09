"use client";

import { useEffect, useState, type MouseEvent, type CSSProperties } from "react";
import { Minus, Plus, Camera, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
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
  onUpdateName: (name: string) => void;
  nameStatus: string | null;
  isUpdatingName: boolean;
  isUpdatingAvatar: boolean;
  isAddCooldown: boolean;
  isUploadingPhoto: boolean;
  photoSendStatus: "success" | "error" | null;
  photoModeEnabled: boolean;
  photoRequired: boolean;
  addCooldownMs: number;
  onPhotoIncrement: (
    id: string,
    event?: MouseEvent<HTMLButtonElement>,
  ) => void;
  isLoggedIn: boolean;
  isPremium: boolean;
  exclusiveAvatars: string[];
}

export function PersonalProgress({
  participant,
  getItemLabel,
  onUpdateCount,
  onUpdateAvatar,
  onUpdateName,
  nameStatus,
  isUpdatingName,
  isUpdatingAvatar,
  isAddCooldown,
  isUploadingPhoto,
  photoSendStatus,
  photoModeEnabled,
  photoRequired,
  addCooldownMs,
  onPhotoIncrement,
  isLoggedIn,
  isPremium,
  exclusiveAvatars,
}: PersonalProgressProps) {
  const { t } = useLanguage();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarOptions, setAvatarOptions] = useState<string[]>([]);
  const [nameDraft, setNameDraft] = useState(participant.name ?? "");
  const [showNameIndicator, setShowNameIndicator] = useState(true);
  const cooldownStyle: CSSProperties = {
    "--cooldown-duration": `${addCooldownMs}ms`,
  } as CSSProperties;
  const teamBadgeStyles: Record<string, string> = {
    AZUL: "border-blue-500/40 text-blue-500",
    VERMELHA: "border-red-500/40 text-red-500",
    VERDE: "border-emerald-500/40 text-emerald-400",
    AMARELA: "border-yellow-500/40 text-yellow-400",
  };
  const teamLabels: Record<string, string> = {
    AZUL: t.room.team_blue,
    VERMELHA: t.room.team_red,
    VERDE: t.room.team_green,
    AMARELA: t.room.team_yellow,
  };
  const teamLabel = participant.team
    ? teamLabels[participant.team] ?? participant.team
    : null;
  const teamBadgeClass = participant.team
    ? teamBadgeStyles[participant.team] ?? "border-muted text-muted-foreground"
    : null;
  const teamHighlightClass = participant.team
    ? {
        AZUL: "ring-blue-500/60 ring-2 shadow-[0_18px_40px_rgba(59,130,246,0.2)]",
        VERMELHA: "ring-red-500/60 ring-2 shadow-[0_18px_40px_rgba(239,68,68,0.2)]",
        VERDE:
          "ring-emerald-500/60 ring-2 shadow-[0_18px_40px_rgba(16,185,129,0.2)]",
        AMARELA:
          "ring-yellow-500/60 ring-2 shadow-[0_18px_40px_rgba(234,179,8,0.22)]",
      }[participant.team] ?? "ring-primary/40"
    : "ring-primary/40";

  useEffect(() => {
    let isMounted = true;
    const loadAvatars = async () => {
      try {
        const response = await fetch("/api/avatars");
        if (!response.ok) return;
        const data = await response.json();
        const list = Array.isArray(data?.avatars) ? data.avatars : [];
        if (list.length === 0) return;
        const unlocked = list.filter((opt) => {
          if (opt === participant.avatar) return true;
          if (isExclusiveAvatar(opt)) return exclusiveAvatars.includes(opt);
          if (isPremiumAvatar(opt)) return isPremium;
          return true;
        });
        const locked = list.filter((opt) => {
          if (opt === participant.avatar) return false;
          if (isExclusiveAvatar(opt)) return !exclusiveAvatars.includes(opt);
          if (isPremiumAvatar(opt)) return !isPremium;
          return false;
        });
        if (isMounted) setAvatarOptions([...unlocked, ...locked]);
      } catch {
        return;
      }
    };

    loadAvatars();
    return () => {
      isMounted = false;
    };
  }, [exclusiveAvatars, isPremium, participant.avatar]);

  useEffect(() => {
    if (showAvatarPicker) {
      setNameDraft(participant.name ?? "");
      setShowNameIndicator(true);
    }
  }, [showAvatarPicker, participant.name]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 px-1 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
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
        {participant.team && teamLabel && (
          <Badge
            variant="outline"
            className={`text-[8px] h-4 uppercase font-black ${teamBadgeClass}`}
          >
            {teamLabel}
          </Badge>
        )}
      </div>
      <Card className={`ring-1 ${teamHighlightClass} shadow-lg border-none bg-card/80 backdrop-blur-sm`}>
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
                  className="h-full w-full rounded-2xl object-contain"
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
                  className="relative h-7 w-7 overflow-hidden rounded-full hover:bg-destructive/10 hover:text-destructive active:scale-75 transition-all duration-200 cursor-pointer"
                  onClick={(event) => onUpdateCount(participant.id, -1, event)}
                  disabled={participant.items_eaten === 0}
                >
                  {isAddCooldown && (
                    <span
                      className="pointer-events-none absolute inset-0 bg-destructive/20 cooldown-fill"
                      style={cooldownStyle}
                    />
                  )}
                  <Minus className="relative z-10 h-3.5 w-3.5" />
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
                  className={`relative h-7 w-7 overflow-hidden rounded-full hover:bg-primary/10 hover:text-primary active:scale-75 transition-all duration-200 cursor-pointer ${
                    isAddCooldown ? "opacity-50 grayscale" : ""
                  }`}
                  onClick={(event) => onUpdateCount(participant.id, 1, event)}
                >
                  {isAddCooldown && (
                    <span
                      className="pointer-events-none absolute inset-0 bg-primary/20 cooldown-fill"
                      style={cooldownStyle}
                    />
                  )}
                  <Plus className="relative z-10 h-3.5 w-3.5" />
                </Button>
              )}
              </div>
              {photoModeEnabled && (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-200/20 p-1 shadow-sm dark:bg-amber-900/20">
                  <Button
                    variant="ghost"
                    className={`relative h-7 rounded-full px-2 text-[10px] font-black uppercase tracking-wide text-amber-700 transition-all duration-200 hover:bg-amber-200/40 hover:text-amber-800 dark:text-amber-200 dark:hover:text-amber-100 ${
                      isAddCooldown || isUploadingPhoto || !isLoggedIn
                        ? "opacity-50 grayscale"
                        : ""
                    } ${
                      photoSendStatus === "success"
                        ? "ring-2 ring-emerald-300/80 animate-pulse"
                        : ""
                    } ${
                      photoSendStatus === "error"
                        ? "ring-2 ring-red-500/80 animate-pulse"
                        : ""
                    }`}
                    onClick={(event) => {
                      if (!isLoggedIn) {
                        toast.error(
                          t.room.login_to_use_camera ??
                            "Faça login para usar o modo câmera.",
                        );
                        return;
                      }
                      onPhotoIncrement(participant.id, event);
                    }}
                    disabled={isUploadingPhoto}
                  >
                    <Camera className="mr-1 h-3.5 w-3.5" />
                    +1
                    {photoSendStatus && (
                      <span
                        className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-background ${
                          photoSendStatus === "success"
                            ? "bg-emerald-500 text-white"
                            : "bg-red-500 text-white"
                        } animate-in zoom-in duration-200`}
                      >
                        {photoSendStatus === "success" ? (
                          <Check className="h-2.5 w-2.5" />
                        ) : (
                          <X className="h-2.5 w-2.5" />
                        )}
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {showAvatarPicker && (
            <div className="border-t border-muted/40 pt-2 pb-0 space-y-2">
              <div className="relative flex flex-wrap items-center gap-2">
                <Input
                  value={nameDraft}
                  onChange={(event) => {
                    setNameDraft(event.target.value);
                    setShowNameIndicator(false);
                  }}
                  placeholder={t.room.change_name_placeholder}
                  className="h-10 text-sm uppercase"
                  maxLength={20}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    if (!nameDraft.trim()) return;
                    if (nameDraft.trim() === (participant.name ?? "")) return;
                    onUpdateName(nameDraft);
                  }}
                  style={{
                    width: `${Math.max(10, Math.min(24, nameDraft.length + 4))}ch`,
                    maxWidth: "100%",
                  }}
                />
                {showNameIndicator && (
                  <span className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                    {t.room.change_name_indicator}
                  </span>
                )}
                {nameDraft.trim() !== (participant.name ?? "") &&
                  nameDraft.trim().length > 0 && (
                  <Button
                    onClick={() => onUpdateName(nameDraft)}
                    disabled={isUpdatingName}
                    className="h-10 px-3 text-[10px] font-black uppercase tracking-[0.16em] ml-auto"
                  >
                    {isUpdatingName
                      ? t.common.loading
                      : t.room.change_name_save}
                  </Button>
                )}
              </div>
              {nameStatus && (
                <p className="text-xs font-semibold text-destructive">
                  {nameStatus}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {avatarOptions.map((opt) => {
                  const isSelected = participant.avatar === opt;
                  const isPremiumOption = isPremiumAvatar(opt);
                  const isExclusiveOption = isExclusiveAvatar(opt);
                  const isLocked =
                    (isPremiumOption && !isPremium) ||
                    (isExclusiveOption && !exclusiveAvatars.includes(opt));
                  const lockedMessage = isExclusiveOption
                    ? t.room.exclusive_avatar_locked ??
                      "This is an exclusive avatar."
                    : isPremiumOption
                      ? t.room.premium_avatar_locked ??
                        "This is a premium avatar."
                      : "";
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
                        if (isLocked) {
                          if (lockedMessage) toast.info(lockedMessage);
                          return;
                        }
                        onUpdateAvatar(opt);
                        setShowAvatarPicker(false);
                      }}
                      aria-disabled={isLocked}
                      className={`w-11 h-11 rounded-lg border transition-all text-xl flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? "ring-2 ring-primary bg-primary/20 scale-110 shadow-lg"
                          : "hover:border-primary/40 bg-background/40 hover:bg-background/60"
                      } ${premiumBorderClass} ${exclusiveBorderClass} ${
                        isUpdatingAvatar || isLocked
                          ? "opacity-50 cursor-not-allowed grayscale"
                          : ""
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

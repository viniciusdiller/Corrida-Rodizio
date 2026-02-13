"use client";

import { Trophy, Home, Grid2x2, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Race, Participant } from "@/types/database";
import { getAvatarUrl, isImageAvatar } from "@/lib/utils/avatars";
import { useLanguage } from "@/contexts/language-context";
import { ShareStoryButton } from "./share-story-button";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

type HallOfFameViewMode = "big" | "compact";

const TEAM_OPTIONS = [
  { id: "AZUL", shortLabel: "Azul", nameClass: "text-blue-300" },
  {
    id: "VERMELHA",
    shortLabel: "Vermelho",
    nameClass: "text-red-300",
  },
  {
    id: "VERDE",
    shortLabel: "Verde",
    nameClass: "text-emerald-300",
  },
  {
    id: "AMARELA",
    shortLabel: "Amarelo",
    nameClass: "text-yellow-300",
  },
];

interface HallOfFameProps {
  race: Race;
  participants: Participant[];
  maxScore: number;
  getItemLabel: (count: number) => string;
  onHome: () => void;
  currentParticipantId?: string | null;
  onReopenRace?: () => Promise<void> | void;
}

export function HallOfFame({
  race,
  participants,
  maxScore,
  getItemLabel,
  onHome,
  currentParticipantId,
  onReopenRace,
}: HallOfFameProps) {
  const { t } = useLanguage();
  const MOTIVATIONAL_PHRASES =
    race.food_type === "drinks"
      ? (t.hall_of_fame.drinks_phrases ?? t.hall_of_fame.phrases)
      : t.hall_of_fame.phrases;
  const currentParticipant = participants.find(
    (participant) => participant.id === currentParticipantId,
  );
  const [timeline, setTimeline] = useState<
    {
      id: string;
      createdAt: string;
      itemNumber: number;
      participantName: string;
      signedUrl: string | null;
    }[]
  >([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [isSharingPhoto, setIsSharingPhoto] = useState(false);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [viewMode, setViewMode] = useState<HallOfFameViewMode>("big");
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>(
    {},
  );

  // Função para pegar uma frase baseada no ID e Sala (Pseudo-aleatória e estável)
  const getMotivationalPhrase = (participantId: string) => {
    if (!MOTIVATIONAL_PHRASES || MOTIVATIONAL_PHRASES.length === 0) return "";
    const seed = participantId + race.room_code;
    const hash = seed
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return MOTIVATIONAL_PHRASES[hash % MOTIVATIONAL_PHRASES.length];
  };

  useEffect(() => {
    const loadTimeline = async () => {
      if (!race.photo_mode || !currentParticipantId) return;
      setIsLoadingTimeline(true);
      setTimelineError(false);
      try {
        const response = await fetch(
          `/api/race-photos/timeline?roomCode=${encodeURIComponent(
            race.room_code,
          )}&participantId=${encodeURIComponent(currentParticipantId)}`,
        );
        if (response.status === 403) {
          setTimeline([]);
          return;
        }
        const data = await response.json().catch(() => ({}));
        const photos = Array.isArray(data?.photos) ? data.photos : [];
        setTimeline(photos);
      } catch {
        setTimelineError(true);
      } finally {
        setIsLoadingTimeline(false);
      }
    };

    loadTimeline();
  }, [race.photo_mode, race.room_code, currentParticipantId]);

  useEffect(() => {
    const nextLoading: Record<string, boolean> = {};
    timeline.forEach((photo) => {
      if (photo.signedUrl) {
        nextLoading[photo.id] = true;
      }
    });
    setLoadingPhotos(nextLoading);
  }, [timeline]);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 flex flex-col items-center justify-center animate-in fade-in duration-1000">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex rounded-xl border border-border bg-card/80 p-1">
            <button
              type="button"
              aria-label="Big view"
              onClick={() => setViewMode("big")}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === "big"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid2x2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Compact view"
              onClick={() => setViewMode("compact")}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === "compact"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Rows3 className="h-4 w-4" />
            </button>
          </div>
          <div className="inline-block rounded-2xl bg-primary p-2.5 shadow-2xl shadow-primary/20">
            <Trophy
              className={`text-primary-foreground ${
                viewMode === "compact" ? "h-6 w-6" : "h-10 w-10"
              }`}
            />
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-xs font-mono text-muted-foreground tracking-widest">
            rodiziorace.mechama.eu
          </p>
          <div className="space-y-1">
            <h1
              className={`font-black italic tracking-tighter uppercase ${
                viewMode === "compact" ? "text-3xl" : "text-4xl"
              }`}
            >
              {t.hall_of_fame.title}
            </h1>
            <p className="text-primary font-mono text-sm tracking-widest">
              {t.common.room}: {race.room_code}
            </p>
          </div>
        </div>

        <div className={viewMode === "compact" ? "space-y-2" : "space-y-4"}>
          {participants.map((p, i) => {
            const isWinner = p.items_eaten === maxScore && maxScore > 0;
            const team = TEAM_OPTIONS.find((t) => t.id === p.team);
            const cardPadding = viewMode === "compact" ? "p-3" : "p-5";
            return (
              <div
                key={p.id}
                className={`relative overflow-hidden flex items-center justify-between ${cardPadding} rounded-3xl border-2 transition-all ${
                  isWinner
                    ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(249,115,22,0.2)]"
                    : "border-border bg-card/60"
                }`}
              >
                <div
                  className={`z-10 flex items-center ${
                    viewMode === "compact" ? "gap-2" : "gap-4"
                  }`}
                >
                  <div className={viewMode === "compact" ? "text-xl" : "text-3xl"}>
                    {p.avatar && isImageAvatar(p.avatar) ? (
                      <img
                        src={getAvatarUrl(p.avatar)}
                        alt=""
                        className={
                          viewMode === "compact"
                            ? "h-8 w-8 object-contain"
                            : "h-10 w-10 object-contain"
                        }
                      />
                    ) : (
                      <span className="inline-block h-9 w-9 rounded-full bg-white/10" />
                    )}
                  </div>
                  <span
                    className={`text-2xl font-black ${
                      isWinner ? "text-primary" : "text-foreground"
                    } ${viewMode === "compact" ? "text-lg" : "text-2xl"}`}
                  >
                    #{i + 1}
                  </span>
                  <div>
                    <p
                      className={`font-bold leading-tight ${
                        viewMode === "compact" ? "text-base" : "text-xl"
                      } ${
                        race.is_team_mode && team ? team.nameClass : ""
                      }`}
                    >
                      {p.name}
                    </p>
                    <p
                      className={`text-muted-foreground uppercase font-bold tracking-wider ${
                        viewMode === "compact" ? "text-[9px]" : "text-[10px]"
                      }`}
                    >
                      {isWinner
                        ? t.hall_of_fame.legendary
                        : getMotivationalPhrase(p.id)}
                    </p>
                  </div>
                </div>
                <div className="text-right z-10">
                  <p
                    className={`font-black leading-none ${
                      viewMode === "compact" ? "text-2xl" : "text-3xl"
                    }`}
                  >
                    {p.items_eaten}
                  </p>
                  <p
                    className={`uppercase font-bold text-muted-foreground ${
                      viewMode === "compact" ? "text-[9px] mt-0.5" : "text-[10px] mt-1"
                    }`}
                  >
                    {getItemLabel(p.items_eaten)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col items-center gap-4 pt-4 w-full">
          {race.photo_mode && currentParticipantId && (
            <div className="w-full space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                {t.hall_of_fame.photo_timeline}
              </p>
              {isLoadingTimeline && (
                <p className="text-xs text-muted-foreground">
                  {t.hall_of_fame.timeline_loading}
                </p>
              )}
              {!isLoadingTimeline && timelineError && (
                <p className="text-xs text-muted-foreground">
                  {t.hall_of_fame.timeline_error}
                </p>
              )}
              {!isLoadingTimeline &&
                !timelineError &&
                timeline.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t.hall_of_fame.timeline_empty}
                  </p>
                )}
              {timeline.length > 0 && (
                <div className="space-y-2">
                  {timeline.map((photo) => (
                    <div key={photo.id} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="w-10 text-right">
                          {new Date(photo.createdAt).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                        <div className="relative flex items-center">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          <span className="ml-1 h-px w-6 bg-border" />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40"
                        onClick={() => {
                          if (photo.signedUrl) setActivePhoto(photo.signedUrl);
                        }}
                        aria-busy={loadingPhotos[photo.id] ?? false}
                      >
                        {photo.signedUrl ? (
                          <>
                            {loadingPhotos[photo.id] && (
                              <span className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/70 via-muted/40 to-muted/70" />
                            )}
                            <img
                              src={photo.signedUrl}
                              alt=""
                              className={`h-full w-full object-cover transition-opacity duration-300 ${
                                loadingPhotos[photo.id]
                                  ? "opacity-0"
                                  : "opacity-100"
                              }`}
                              onLoad={() =>
                                setLoadingPhotos((prev) => ({
                                  ...prev,
                                  [photo.id]: false,
                                }))
                              }
                              onError={() =>
                                setLoadingPhotos((prev) => ({
                                  ...prev,
                                  [photo.id]: false,
                                }))
                              }
                            />
                          </>
                        ) : (
                          <span className="block h-full w-full animate-pulse bg-gradient-to-br from-muted/70 via-muted/40 to-muted/70" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-bold">
                          {photo.participantName} · #{photo.itemNumber}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(photo.createdAt).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <ShareStoryButton
            race={race}
            participants={participants}
            maxScore={maxScore}
            getItemLabel={getItemLabel}
            viewMode={viewMode}
          />
          {currentParticipant?.is_vip && (
            <Button
              variant="outline"
              className="w-full rounded-2xl"
              onClick={() => setShowReopenConfirm(true)}
              disabled={isReopening}
            >
              {t.hall_of_fame.reopen_race ?? "Reabrir corrida"}
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full rounded-2xl"
            onClick={onHome}
          >
            <Home className="h-4 w-4 mr-2" /> {t.hall_of_fame.home}
          </Button>
        </div>
      </div>
      {showReopenConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowReopenConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm space-y-4 rounded-2xl border border-muted/60 bg-background/95 p-5 shadow-xl">
              <div className="space-y-1 text-center">
                <h2 className="text-lg font-bold">
                  {t.hall_of_fame.reopen_confirm_title ?? "Reabrir corrida?"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t.hall_of_fame.reopen_confirm_desc ??
                    "Deseja reabrir esta corrida para continuar jogando?"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowReopenConfirm(false)}
                  disabled={isReopening}
                >
                  {t.room.cancel}
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={async () => {
                    if (!currentParticipantId) return;
                    setIsReopening(true);
                    try {
                      const response = await fetch("/api/races/reopen", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          roomCode: race.room_code,
                          requesterId: currentParticipantId,
                        }),
                      });
                      if (!response.ok) {
                        throw new Error("reopen_failed");
                      }
                      setShowReopenConfirm(false);
                      await onReopenRace?.();
                    } catch {
                      return;
                    } finally {
                      setIsReopening(false);
                    }
                  }}
                  disabled={isReopening}
                >
                  {t.hall_of_fame.reopen_confirm_action ?? "Reabrir"}
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
      {activePhoto && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setActivePhoto(null)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-3">
            <img
              src={activePhoto}
              alt=""
              className="w-full rounded-xl object-contain"
            />
            <div className="mt-3 flex justify-center">
              <Button
                variant="outline"
                className="border-border"
                disabled={isSharingPhoto}
                onClick={async () => {
                  if (!activePhoto) return;
                  setIsSharingPhoto(true);
                  try {
                    const response = await fetch(activePhoto);
                    const blob = await response.blob();
                    const file = new File([blob], "photo.jpg", {
                      type: blob.type || "image/jpeg",
                    });
                    if (navigator.canShare?.({ files: [file] })) {
                      await navigator.share({ files: [file] });
                    } else {
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = "photo.jpg";
                      link.click();
                      URL.revokeObjectURL(url);
                    }
                  } catch {
                    return;
                  } finally {
                    setIsSharingPhoto(false);
                  }
                }}
              >
                {isSharingPhoto ? "..." : t.hall_of_fame.share_photo}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

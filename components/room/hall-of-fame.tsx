"use client";

import { ArrowLeft, Home, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Race, Participant } from "@/types/database";
import { getAvatarUrl, isGifAvatar, isImageAvatar } from "@/lib/utils/avatars";
import { useLanguage } from "@/contexts/language-context";
import { ShareStoryButton } from "./share-story-button";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";

const TEAM_OPTIONS = [
  { id: "AZUL", borderClass: "border-blue-500/90 dark:border-blue-400/90" },
  {
    id: "VERMELHA",
    borderClass: "border-red-500/90 dark:border-red-400/90",
  },
  {
    id: "VERDE",
    borderClass: "border-emerald-500/90 dark:border-emerald-400/90",
  },
  {
    id: "AMARELA",
    borderClass: "border-yellow-500/90 dark:border-yellow-400/90",
  },
];

const getNameFontSize = (name: string) => {
  const length = name.trim().length;
  if (length >= 24) return 6;
  if (length >= 20) return 7;
  if (length >= 16) return 8;
  if (length >= 12) return 9;
  if (length >= 8) return 10;
  return 12;
};

const stripEmojis = (value: string) =>
  value.replace(/\p{Extended_Pictographic}/gu, "").trim();

function HallOfFameAvatar({
  avatar,
  className,
}: {
  avatar: string;
  className: string;
}) {
  const isGif = isGifAvatar(avatar);
  const [staticGifFrame, setStaticGifFrame] = useState<string | null>(null);

  useEffect(() => {
    if (!isGif || staticGifFrame) return;

    const image = new Image();
    image.src = getAvatarUrl(avatar);
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(image, 0, 0);
      setStaticGifFrame(canvas.toDataURL("image/png"));
    };
  }, [avatar, isGif, staticGifFrame]);

  if (isGif && !staticGifFrame) {
    return <span className="block h-8 w-8 bg-muted" />;
  }

  return <img src={staticGifFrame ?? getAvatarUrl(avatar)} alt="" className={className} />;
}

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
        const sortedPhotos = [...photos].sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        setTimeline(sortedPhotos);
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

  useEffect(() => {
    if (!activePhoto) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyTouchAction = document.body.style.touchAction;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevHtmlTouchAction = document.documentElement.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.touchAction = "none";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.touchAction = prevBodyTouchAction;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.touchAction = prevHtmlTouchAction;
    };
  }, [activePhoto]);

  const rankedParticipants = [...participants]
    .sort((a, b) => {
      if (b.items_eaten !== a.items_eaten) {
        return b.items_eaten - a.items_eaten;
      }

      // Tie-breaker: latest eater/drinker wins.
      const updatedDiff =
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      if (updatedDiff !== 0) {
        return updatedDiff;
      }

      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    })
    .map((participant, index) => ({
      participant,
      position: index + 1,
    }));
  const topParticipant = rankedParticipants[0];
  const remainingParticipants = rankedParticipants.slice(1);
  const leftColumnParticipants = remainingParticipants.filter(
    ({ position }) => position % 2 === 1,
  );
  const rightColumnParticipants = remainingParticipants.filter(
    ({ position }) => position % 2 === 0,
  );
  const tileClass =
    "relative size-28 shrink-0 sm:size-32 rounded-[1.6rem] border border-white/70 bg-white/80 px-2.5 py-2.5 text-center flex flex-col items-center gap-1 overflow-hidden shadow-[0_12px_26px_rgba(0,0,0,0.10)] backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05] dark:shadow-[0_14px_30px_rgba(0,0,0,0.35)]";
  const rankBadgeClass =
    "pointer-events-none absolute left-1 top-1 z-30 inline-block px-1 text-2xl sm:text-3xl font-black italic leading-none text-orange-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)] dark:text-purple-300";
  const winnerTileClass =
    "border-orange-400/80 bg-gradient-to-b from-orange-100/95 to-orange-50/85 ring-2 ring-orange-300/60 dark:border-purple-400/70 dark:bg-gradient-to-b dark:from-purple-900/60 dark:to-zinc-900/80 dark:ring-purple-500/40";
  const winnerAccentClass = "text-orange-600 dark:text-purple-300";
  const phraseClass =
    "w-[4.5rem] sm:w-[6rem] text-[11px] sm:text-sm font-medium leading-tight text-foreground/75";
  const phraseRightClass = "text-right";
  const phraseLeftClass = "text-left";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-orange-50 via-background to-orange-100 text-foreground p-2 sm:p-6 flex flex-col items-center justify-center animate-in fade-in duration-1000 dark:from-black dark:via-zinc-950 dark:to-[#12061a]">
      <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-orange-300/30 blur-3xl dark:bg-purple-500/20" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-amber-300/25 blur-3xl dark:bg-violet-500/20" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-orange-200/35 blur-3xl dark:bg-purple-700/25" />

      <div className="relative w-full max-w-xl space-y-8">
        <div className="mx-auto flex w-full max-w-lg items-center justify-center gap-3 sm:gap-5">
          <div className="space-y-2 text-left">
            <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tight text-orange-600 dark:text-purple-300">
              {t.hall_of_fame.title}
            </h1>
            <p className="inline-flex rounded-full border border-border/70 bg-background/75 px-4 py-1.5 text-xs sm:text-sm font-semibold tracking-[0.14em] text-muted-foreground backdrop-blur">
              rodiziorace.mechama.eu
            </p>
          </div>
          <div className="shrink-0">
            <img
              src="/logo-big-light.png"
              alt="Rodizio Race"
              className="block h-16 w-auto dark:hidden sm:h-20"
            />
            <img
              src="/logo-big-dark.png"
              alt="Rodizio Race"
              className="hidden h-16 w-auto dark:block sm:h-20"
            />
          </div>
        </div>

        <div className="space-y-5">
          {topParticipant && (() => {
            const p = topParticipant.participant;
            const team = TEAM_OPTIONS.find(
              (teamOption) => teamOption.id === p.team,
            );
            const teamTileBorderClass =
              race.is_team_mode && team ? team.borderClass : "";
            const avatar = p.avatar ?? "";
            const hasImageAvatar = isImageAvatar(avatar);
            const isLegendary = maxScore > 0;
            const topPhrase = isLegendary
              ? stripEmojis(t.hall_of_fame.legendary).toUpperCase()
              : getMotivationalPhrase(p.id);

            return (
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
                <p
                  className={`${phraseClass} ${phraseRightClass} justify-self-end pr-1 sm:pr-2 ${
                    isLegendary
                      ? "text-sm sm:text-base font-black uppercase tracking-[0.1em]"
                      : ""
                  }`}
                >
                  {topPhrase}
                </p>
                <div className="relative inline-block">
                  <span className={rankBadgeClass}>#{topParticipant.position}</span>
                  <div className={`${tileClass} ${winnerTileClass} ${teamTileBorderClass}`}>
                    <div className="mt-0.5 flex h-10 w-full items-center justify-center">
                      {hasImageAvatar ? (
                        <HallOfFameAvatar
                          avatar={avatar}
                          className="h-8 w-auto max-h-8 max-w-full object-contain"
                        />
                      ) : (
                        <span className="block h-8 w-8 bg-muted" />
                      )}
                    </div>
                    <p
                      className="flex h-5 sm:h-6 w-full items-center justify-center px-1 text-center font-black uppercase leading-none whitespace-nowrap overflow-hidden"
                      style={{ fontSize: `${getNameFontSize(p.name)}px` }}
                    >
                      {p.name}
                    </p>
                    <div className="mt-auto leading-none">
                      <p className={`text-xl sm:text-2xl font-black tracking-tight ${winnerAccentClass}`}>
                        {p.items_eaten}
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[10px]">
                        {getItemLabel(p.items_eaten)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="justify-self-start -ml-1 pt-2 sm:-ml-2 sm:pt-3">
                  <div className="inline-flex h-16 w-14 rotate-[8deg] flex-col items-center justify-center rounded-2xl border border-white/70 bg-white/75 shadow-[0_12px_20px_rgba(0,0,0,0.14)] backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
                    <Trophy className="h-5 w-5 text-orange-500 dark:text-purple-300" />
                    <span className="mt-0.5 text-[9px] font-black uppercase tracking-wide text-orange-600 dark:text-purple-300">
                      MVP
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-x-2 sm:gap-x-3">
            <div className="space-y-3.5 pt-12">
              {leftColumnParticipants.map(({ participant: p, position }) => {
                const team = TEAM_OPTIONS.find(
                  (teamOption) => teamOption.id === p.team,
                );
                const teamTileBorderClass =
                  race.is_team_mode && team ? team.borderClass : "";
                const avatar = p.avatar ?? "";
                const hasImageAvatar = isImageAvatar(avatar);
                const phrase = getMotivationalPhrase(p.id);

                return (
                  <div key={p.id} className="flex items-center justify-end gap-1 sm:gap-2">
                    <p className={`${phraseClass} ${phraseRightClass}`}>
                      {phrase}
                    </p>
                    <div className="relative inline-block">
                      <span className={rankBadgeClass}>#{position}</span>
                      <div className={`${tileClass} ${teamTileBorderClass}`}>
                        <div className="mt-0.5 flex h-10 w-full items-center justify-center">
                          {hasImageAvatar ? (
                            <HallOfFameAvatar
                              avatar={avatar}
                              className="h-8 w-auto max-h-8 max-w-full object-contain"
                            />
                          ) : (
                            <span className="block h-8 w-8 bg-muted" />
                          )}
                        </div>
                        <p
                          className="flex h-5 sm:h-6 w-full items-center justify-center px-1 text-center font-black uppercase leading-none whitespace-nowrap overflow-hidden"
                          style={{ fontSize: `${getNameFontSize(p.name)}px` }}
                        >
                          {p.name}
                        </p>
                        <div className="mt-auto leading-none">
                          <p className="text-xl sm:text-2xl font-black tracking-tight">{p.items_eaten}</p>
                          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[10px]">
                            {getItemLabel(p.items_eaten)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3.5">
              {rightColumnParticipants.map(({ participant: p, position }) => {
                const team = TEAM_OPTIONS.find(
                  (teamOption) => teamOption.id === p.team,
                );
                const teamTileBorderClass =
                  race.is_team_mode && team ? team.borderClass : "";
                const avatar = p.avatar ?? "";
                const hasImageAvatar = isImageAvatar(avatar);
                const phrase = getMotivationalPhrase(p.id);

                return (
                  <div key={p.id} className="flex items-center justify-start gap-1 sm:gap-2">
                    <div className="relative inline-block">
                      <span className={rankBadgeClass}>#{position}</span>
                      <div className={`${tileClass} ${teamTileBorderClass}`}>
                        <div className="mt-0.5 flex h-10 w-full items-center justify-center">
                          {hasImageAvatar ? (
                            <HallOfFameAvatar
                              avatar={avatar}
                              className="h-8 w-auto max-h-8 max-w-full object-contain"
                            />
                          ) : (
                            <span className="block h-8 w-8 bg-muted" />
                          )}
                        </div>
                        <p
                          className="flex h-5 sm:h-6 w-full items-center justify-center px-1 text-center font-black uppercase leading-none whitespace-nowrap overflow-hidden"
                          style={{ fontSize: `${getNameFontSize(p.name)}px` }}
                        >
                          {p.name}
                        </p>
                        <div className="mt-auto leading-none">
                          <p className="text-xl sm:text-2xl font-black tracking-tight">{p.items_eaten}</p>
                          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[10px]">
                            {getItemLabel(p.items_eaten)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className={`${phraseClass} ${phraseLeftClass}`}>
                      {phrase}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
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
      {activePhoto &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={() => setActivePhoto(null)}
            />
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setActivePhoto(null)}
            >
              <div
                className="w-full max-w-xl rounded-2xl border border-border bg-card p-3"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-2 flex justify-start">
                  <Button
                    variant="ghost"
                    className="h-8 px-2 text-xs"
                    onClick={() => setActivePhoto(null)}
                  >
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                    Back
                  </Button>
                </div>
                <img
                  src={activePhoto}
                  alt=""
                  className="mx-auto max-h-[70vh] w-full rounded-xl object-contain"
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
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

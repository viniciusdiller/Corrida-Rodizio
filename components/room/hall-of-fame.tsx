"use client";

import { Trophy, Instagram, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Race, Participant } from "@/types/database";
import { getAvatarUrl, isImageAvatar } from "@/lib/utils/avatars";
import { useLanguage } from "@/contexts/language-context";
import { ShareStoryButton } from "./share-story-button";
import { useEffect, useState } from "react";

const TEAM_OPTIONS = [
  { id: "AZUL", shortLabel: "Azul", pillClass: "bg-blue-500/20 text-blue-300" },
  {
    id: "VERMELHA",
    shortLabel: "Vermelho",
    pillClass: "bg-red-500/20 text-red-300",
  },
  {
    id: "VERDE",
    shortLabel: "Verde",
    pillClass: "bg-emerald-500/20 text-emerald-300",
  },
  {
    id: "AMARELA",
    shortLabel: "Amarelo",
    pillClass: "bg-yellow-500/20 text-yellow-300",
  },
];

interface HallOfFameProps {
  race: Race;
  participants: Participant[];
  maxScore: number;
  getItemLabel: (count: number) => string;
  onHome: () => void;
  currentParticipantId?: string | null;
}

export function HallOfFame({
  race,
  participants,
  maxScore,
  getItemLabel,
  onHome,
  currentParticipantId,
}: HallOfFameProps) {
  const { t } = useLanguage();
  const MOTIVATIONAL_PHRASES = t.hall_of_fame.phrases;
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

  useEffect(() => {
    const loadTimeline = async () => {
      if (!race.photo_mode || !currentParticipantId) return;
      setIsLoadingTimeline(true);
      setTimelineError(false);
      try {
        const response = await fetch(
          `/api/race-photos/timeline?roomCode=${encodeURIComponent(
            race.room_code
          )}&participantId=${encodeURIComponent(currentParticipantId)}`
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center animate-in fade-in duration-1000">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-block p-3 bg-orange-500 rounded-2xl rotate-3 shadow-2xl shadow-orange-500/20">
            <Trophy className="h-10 w-10 text-zinc-950" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">
              {t.hall_of_fame.title}
            </h1>
            <p className="text-orange-500 font-mono text-sm tracking-widest">
              {t.common.room}: {race.room_code}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {participants.map((p, i) => {
            const isWinner = p.items_eaten === maxScore && maxScore > 0;
            const team = TEAM_OPTIONS.find((t) => t.id === p.team);
            return (
              <div
                key={p.id}
                className={`relative overflow-hidden flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${
                  isWinner
                    ? "border-orange-500 bg-orange-500/10 scale-105 shadow-[0_0_30px_rgba(249,115,22,0.2)]"
                    : "border-white/5 bg-white/5"
                }`}
              >
                <div className="flex items-center gap-4 z-10">
                  <div className="text-3xl">
                    {isImageAvatar(p.avatar) ? (
                      <img
                        src={getAvatarUrl(p.avatar)}
                        alt=""
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <span className="inline-block h-9 w-9 rounded-full bg-white/10" />
                    )}
                  </div>
                  <span
                    className={`text-2xl font-black ${
                      isWinner ? "text-orange-500" : "text-zinc-200"
                    }`}
                  >
                    #{i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-xl leading-tight flex items-center gap-2">
                      {p.name}
                      {race.is_team_mode && team && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${team.pillClass}`}
                        >
                          {team.shortLabel}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                      {isWinner
                        ? t.hall_of_fame.legendary
                        : MOTIVATIONAL_PHRASES[i % MOTIVATIONAL_PHRASES.length]}
                    </p>
                  </div>
                </div>
                <div className="text-right z-10">
                  <p className="text-3xl font-black leading-none">
                    {p.items_eaten}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-zinc-500 mt-1">
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
              {!isLoadingTimeline && !timelineError && timeline.length === 0 && (
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
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                        <div className="relative flex items-center">
                          <span className="h-2 w-2 rounded-full bg-orange-400" />
                          <span className="ml-1 h-px w-6 bg-white/20" />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/10"
                        onClick={() => {
                          if (photo.signedUrl) setActivePhoto(photo.signedUrl);
                        }}
                      >
                        {photo.signedUrl ? (
                          <img
                            src={photo.signedUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="block h-full w-full" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-bold">
                          {photo.participantName} · #{photo.itemNumber}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(photo.createdAt).toLocaleDateString(
                            "pt-BR"
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

          <Button
            variant="outline"
            className="w-full rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
            onClick={onHome}
          >
            <Home className="h-4 w-4 mr-2" /> {t.hall_of_fame.home}
          </Button>
        </div>
      </div>
      {activePhoto && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setActivePhoto(null)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-zinc-950 p-3">
            <img
              src={activePhoto}
              alt=""
              className="w-full rounded-xl object-contain"
            />
            <div className="mt-3 flex justify-end">
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10"
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
                {isSharingPhoto ? "..." : "Compartilhar foto"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

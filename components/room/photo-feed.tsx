import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import type { Race } from "@/types/database";

const LOCALE_BY_LANG: Record<string, string> = {
  pt: "pt-BR",
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
};

type PhotoTimelineItem = {
  id: string;
  createdAt: string;
  itemNumber: number;
  participantName: string;
  signedUrl: string | null;
};

type PhotoFeedProps = {
  race: Race;
  currentParticipantId: string | null;
  initialTimeline?: PhotoTimelineItem[];
};

export function PhotoFeed({
  race,
  currentParticipantId,
  initialTimeline,
}: PhotoFeedProps) {
  const { t, language } = useLanguage();
  const [timeline, setTimeline] = useState<PhotoTimelineItem[]>(
    initialTimeline ?? [],
  );
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [isSharingPhoto, setIsSharingPhoto] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    if (initialTimeline) {
      setTimeline(initialTimeline);
      setTimelineError(false);
      setIsLoadingTimeline(false);
      return;
    }

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
  }, [race.photo_mode, race.room_code, currentParticipantId, initialTimeline]);

  useEffect(() => {
    const nextLoading: Record<string, boolean> = {};
    timeline.forEach((photo) => {
      if (photo.signedUrl) {
        nextLoading[photo.id] = true;
      }
    });
    setLoadingPhotos(nextLoading);
  }, [timeline]);

  const locale = LOCALE_BY_LANG[language] ?? "pt-BR";

  return (
    <div className="space-y-3">
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
                  {new Date(photo.createdAt).toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
                        loadingPhotos[photo.id] ? "opacity-0" : "opacity-100"
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
                  {new Date(photo.createdAt).toLocaleDateString(locale)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activePhoto && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60"
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
                {isSharingPhoto ? "..." : "Compartilhar foto"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

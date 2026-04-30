import { Check, Copy, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoFeed } from "@/components/room/photo-feed";
import { RaceTrack } from "@/components/room/race-track";
import { RankingSection } from "@/components/room/ranking-section";
import type { Participant, Race } from "@/types/database";

type RoomRaceContentProps = {
  race: Race;
  participants: Participant[];
  currentParticipantId: string | null;
  loggedUsername: string | null;
  hasPhotoTimeline: boolean;
  raceView: "live" | "photos";
  roomCode: string;
  copied: boolean;
  language: string;
  t: any;
  getItemLabel: (count: number) => string;
  onSetRaceView: (view: "live" | "photos") => void;
  onCopyCode: () => void;
  onOpenQrPage: () => void;
};

export function RoomRaceContent({
  race,
  participants,
  currentParticipantId,
  loggedUsername,
  hasPhotoTimeline,
  raceView,
  roomCode,
  copied,
  language,
  t,
  getItemLabel,
  onSetRaceView,
  onCopyCode,
  onOpenQrPage,
}: RoomRaceContentProps) {
  return (
    <>
      {hasPhotoTimeline && (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-muted/60 bg-background/70 p-1">
          <button
            type="button"
            onClick={() => onSetRaceView("live")}
            className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest transition ${
              raceView === "live"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.room.live_race}
          </button>
          <button
            type="button"
            onClick={() => onSetRaceView("photos")}
            className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest transition ${
              raceView === "photos"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.room.photo_feed}
          </button>
        </div>
      )}

      {hasPhotoTimeline && raceView === "photos" ? (
        <div className="rounded-2xl border border-muted/60 bg-background/70 p-4 shadow-sm">
          <PhotoFeed race={race} currentParticipantId={currentParticipantId} />
        </div>
      ) : (
        <>
          {participants.length === 1 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 space-y-4 rounded-xl border-2 border-dashed border-muted/60 bg-muted/5 text-center animate-in fade-in zoom-in duration-500">
              <div className="flex items-center gap-2 rounded-2xl border border-muted/60 bg-background/60 px-3 py-2 shadow-sm">
                <div className="text-right leading-none">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {t.common.room}
                  </p>
                  <p className="font-mono font-bold text-lg leading-none">
                    {roomCode}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onCopyCode}
                  className="h-9 w-9 rounded-xl border border-muted/50 bg-background/80 hover:cursor-pointer"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onOpenQrPage}
                  className="h-9 w-9 rounded-xl border border-muted/50 bg-background/80 hover:cursor-pointer"
                  aria-label={
                    language === "en"
                      ? "Open room QR code"
                      : language === "es"
                        ? "Abrir QR de la sala"
                        : language === "fr"
                          ? "Ouvrir le QR de la salle"
                          : "Abrir QR da sala"
                  }
                  title={
                    language === "en"
                      ? "Open room QR code"
                      : language === "es"
                        ? "Abrir QR de la sala"
                        : language === "fr"
                          ? "Ouvrir le QR de la salle"
                          : "Abrir QR da sala"
                  }
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-foreground">
                  {t.room.waiting_participants}
                </h3>
                <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">
                  {t.room.share_invite_help}
                </p>
              </div>
            </div>
          ) : participants.length >= 2 ? (
            <RaceTrack
              participants={participants}
              isTeamMode={race.is_team_mode}
              viewerLoginCode={loggedUsername}
            />
          ) : null}

          <RankingSection
            race={race}
            participants={participants}
            currentParticipantId={currentParticipantId}
            getItemLabel={getItemLabel}
          />
        </>
      )}
    </>
  );
}

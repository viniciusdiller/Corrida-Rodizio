"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CircleX,
  Menu,
  Settings,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HallOfFame } from "@/components/room/hall-of-fame";
import { PersonalProgress } from "@/components/room/personal-progress";
import { PhotoFeed } from "@/components/room/photo-feed";
import { RaceTrack } from "@/components/room/race-track";
import { RankingSection } from "@/components/room/ranking-section";
import { RoomHeader } from "@/components/room/room-header";
import { RoomInfo } from "@/components/room/room-info";
import { useLanguage } from "@/contexts/language-context";
import { getFoodTypeUnit } from "@/lib/utils/food-type";
import type { Participant, Race } from "@/types/database";

type TourDemoRaceProps = {
  active: boolean;
  stepId: string;
};

type DemoPhotoItem = {
  id: string;
  createdAt: string;
  itemNumber: number;
  participantName: string;
  signedUrl: string | null;
};

const DEMO_RACE: Race = {
  id: "tour-race",
  name: "Sala Demo",
  food_type: "pizza",
  room_code: "TOUR5",
  created_at: "2026-04-11T18:00:00.000Z",
  ended_at: null,
  is_active: true,
  is_team_mode: true,
  photo_mode: true,
  photo_required: false,
};

const BASE_PARTICIPANTS: Participant[] = [
  {
    id: "player-1",
    race_id: "tour-race",
    name: "Mia Turbo",
    login_code: "MIATURBO",
    avatar: "avatar24.png",
    is_vip: true,
    items_eaten: 5,
    team: "AZUL",
    created_at: "2026-04-11T18:00:00.000Z",
    updated_at: "2026-04-11T18:12:00.000Z",
  },
  {
    id: "player-2",
    race_id: "tour-race",
    name: "Leo Slice",
    login_code: "LEOSLICE",
    avatar: "avatar21.png",
    is_vip: false,
    items_eaten: 4,
    team: "VERMELHA",
    created_at: "2026-04-11T18:01:00.000Z",
    updated_at: "2026-04-11T18:11:00.000Z",
  },
  {
    id: "player-3",
    race_id: "tour-race",
    name: "Nina Crunch",
    login_code: "NINACRUNCH",
    avatar: "avatar26.png",
    is_vip: false,
    items_eaten: 3,
    team: "VERDE",
    created_at: "2026-04-11T18:02:00.000Z",
    updated_at: "2026-04-11T18:10:00.000Z",
  },
  {
    id: "player-4",
    race_id: "tour-race",
    name: "Tao Blaze",
    login_code: null,
    avatar: "avatar27.png",
    is_vip: false,
    items_eaten: 2,
    team: "AMARELA",
    created_at: "2026-04-11T18:03:00.000Z",
    updated_at: "2026-04-11T18:09:00.000Z",
  },
];

const BASE_TIMELINE: DemoPhotoItem[] = [
  {
    id: "demo-photo-1",
    createdAt: "2026-04-11T20:17:00.000Z",
    itemNumber: 5,
    participantName: "Mia Turbo",
    signedUrl: "/placeholder.jpg",
  },
  {
    id: "demo-photo-2",
    createdAt: "2026-04-11T20:15:00.000Z",
    itemNumber: 4,
    participantName: "Leo Slice",
    signedUrl: "/placeholder-user.jpg",
  },
  {
    id: "demo-photo-3",
    createdAt: "2026-04-11T20:12:00.000Z",
    itemNumber: 3,
    participantName: "Nina Crunch",
    signedUrl: "/placeholder.jpg",
  },
];

const SCORE_SCRIPT = [
  { playerId: "player-2", addPhoto: false },
  { playerId: "player-3", addPhoto: true },
  { playerId: "player-1", addPhoto: true },
  { playerId: "player-4", addPhoto: false },
  { playerId: "player-2", addPhoto: true },
  { playerId: "player-3", addPhoto: false },
] as const;

export function TourDemoRace({ active, stepId }: TourDemoRaceProps) {
  const { language, t } = useLanguage();
  const [participants, setParticipants] =
    useState<Participant[]>(BASE_PARTICIPANTS);
  const [timeline, setTimeline] = useState<DemoPhotoItem[]>(BASE_TIMELINE);
  const [copied, setCopied] = useState(false);

  const isHallOfFameStep = stepId === "demo-hall-of-fame";
  const currentParticipantId = "player-1";
  const currentParticipant =
    participants.find((participant) => participant.id === currentParticipantId) ??
    null;
  const totalItems = participants.reduce(
    (sum, participant) => sum + participant.items_eaten,
    0,
  );
  const hasPhotoTimeline = timeline.length > 0;
  const raceView = hasPhotoTimeline && stepId === "demo-timeline"
    ? "photos"
    : "live";

  useEffect(() => {
    if (!active) return;
    setParticipants(BASE_PARTICIPANTS);
    setTimeline(BASE_TIMELINE);
    setCopied(false);
  }, [active]);

  useEffect(() => {
    if (!active || isHallOfFameStep) return;

    let scriptIndex = 0;
    const timer = window.setInterval(() => {
      const action = SCORE_SCRIPT[scriptIndex];
      scriptIndex = (scriptIndex + 1) % SCORE_SCRIPT.length;

      let nextCount = 0;
      let actorName = "";

      setParticipants((current) =>
        current.map((participant) => {
          if (participant.id !== action.playerId) return participant;
          nextCount = participant.items_eaten + 1;
          actorName = participant.name;
          return {
            ...participant,
            items_eaten: nextCount,
            updated_at: new Date().toISOString(),
          };
        }),
      );

      if (!action.addPhoto || !actorName || nextCount === 0) return;

      setTimeline((current) => [
        {
          id: `demo-photo-${Date.now()}-${action.playerId}`,
          createdAt: new Date().toISOString(),
          itemNumber: nextCount,
          participantName: actorName,
          signedUrl:
            current.length % 2 === 0 ? "/placeholder.jpg" : "/placeholder-user.jpg",
        },
        ...current,
      ].slice(0, 5));
    }, 1800);

    return () => window.clearInterval(timer);
  }, [active, isHallOfFameStep]);

  const getItemLabel = (count: number) =>
    getFoodTypeUnit(DEMO_RACE.food_type, language, count);

  const hallOfFameRace = useMemo<Race>(
    () => ({
      ...DEMO_RACE,
      is_active: false,
      photo_mode: false,
      photo_required: false,
      ended_at: "2026-04-11T20:25:00.000Z",
    }),
    [],
  );

  if (!active) return null;

  if (isHallOfFameStep) {
    return (
      <div className="tour-allow-motion fixed inset-0 z-[60] overflow-y-auto">
        <div className="min-h-screen">
          <div data-tour="tour-demo-hof">
            <HallOfFame
              race={hallOfFameRace}
              participants={participants}
              maxScore={Math.max(...participants.map((p) => p.items_eaten))}
              getItemLabel={getItemLabel}
              onHome={() => undefined}
              currentParticipantId={currentParticipantId}
              onReopenRace={() => undefined}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tour-allow-motion fixed inset-0 z-[60] overflow-y-auto">
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-background to-orange-100 p-4 text-[15px] md:p-8 md:text-base dark:from-black dark:via-zinc-950 dark:to-[#12061a]">
        <div
          data-tour="tour-demo-room"
          className="mx-auto max-w-2xl space-y-6"
        >
          <RoomHeader
            onExit={() => undefined}
            accountPill={
              currentParticipant ? (
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background/90 px-3 text-xs font-bold text-foreground shadow-sm backdrop-blur transition"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  {currentParticipant.login_code}
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background/90 px-3 text-xs font-bold text-foreground shadow-sm backdrop-blur transition"
                >
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  {t.account.connect_pill}
                </button>
              )
            }
          />

          <div data-tour="tour-demo-room-info">
            <RoomInfo
              race={DEMO_RACE}
              participantsCount={participants.length}
              totalItems={totalItems}
              roomCode={DEMO_RACE.room_code}
              copied={copied}
              onCopyCode={() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              }}
              onOpenQrCode={() => undefined}
            />
          </div>

          <div data-tour="tour-demo-vip" className="flex justify-center">
            <div className="relative flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl font-bold shadow-lg transition-all"
              >
                {t.room.manage_players ?? "Manage players"}
                <Menu className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl font-bold shadow-lg shadow-destructive/20 transition-all"
              >
                {t.room.end_race}
                <CircleX className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {currentParticipant && (
            <div data-tour="tour-demo-progress">
              <PersonalProgress
                participant={currentParticipant}
                getItemLabel={getItemLabel}
                onUpdateCount={() => undefined}
                onUpdateAvatar={() => undefined}
                onUpdateName={() => undefined}
                nameStatus={null}
                isUpdatingName={false}
                isUpdatingAvatar={false}
                isAddCooldown={false}
                isUploadingPhoto={false}
                photoSendStatus={"success"}
                photoModeEnabled={true}
                photoRequired={false}
                addCooldownMs={4000}
                onPhotoIncrement={() => undefined}
                isLoggedIn={true}
                isPremium={false}
                unlockedPremiumAvatars={[]}
                exclusiveAvatars={[]}
                avatarTourId="tour-demo-avatar"
                cameraTourId="tour-demo-camera"
              />
            </div>
          )}

          {hasPhotoTimeline && (
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-muted/60 bg-background/70 p-1">
              <button
                type="button"
                className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest ${
                  raceView === "live"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {t.room.live_race}
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest ${
                  raceView === "photos"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {t.room.photo_feed}
              </button>
            </div>
          )}

          {hasPhotoTimeline && raceView === "photos" ? (
            <div
              data-tour="tour-demo-timeline"
              className="rounded-2xl border border-muted/60 bg-background/70 p-4 shadow-sm"
            >
              <PhotoFeed
                race={DEMO_RACE}
                currentParticipantId={currentParticipantId}
                initialTimeline={timeline}
              />
            </div>
          ) : (
            <>
              <div data-tour="tour-demo-track">
                <RaceTrack
                  participants={participants}
                  isTeamMode={DEMO_RACE.is_team_mode}
                  viewerLoginCode={currentParticipant?.login_code}
                />
              </div>

              <div data-tour="tour-demo-team-points">
                <RankingSection
                  race={DEMO_RACE}
                  participants={participants}
                  currentParticipantId={currentParticipantId}
                  getItemLabel={getItemLabel}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

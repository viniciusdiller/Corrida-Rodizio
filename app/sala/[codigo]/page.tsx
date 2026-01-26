"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, ArrowLeft, Settings } from "lucide-react";
import confetti from "canvas-confetti";

import { RoomHeader } from "@/components/room/room-header";
import { RoomInfo } from "@/components/room/room-info";
import { PersonalProgress } from "@/components/room/personal-progress";
import { RankingSection } from "@/components/room/ranking-section";
import { HallOfFame } from "@/components/room/hall-of-fame";
import { RaceTrack } from "@/components/room/race-track";
import { LoadingScreen } from "@/components/room/loading-screen";

import { getParticipantStorageKey } from "@/lib/utils/participant-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Race, Participant } from "@/types/database";
import { TeamSelection } from "@/components/room/team-selection";
import { useLanguage } from "@/contexts/language-context";

export default function RoomPage() {
  const { t } = useLanguage();
  const LOGIN_STORAGE_KEY = "rodizio-race-login";
  const addCooldownMs = 2_000;

  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCodeRaw = params.codigo as string;
  const roomCode = roomCodeRaw.toUpperCase();
  const isSpectator = searchParams.get("spectator") === "1";

  const [race, setRace] = useState<Race | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isPremiumPlayer, setIsPremiumPlayer] = useState(false);
  const [exclusiveAvatars, setExclusiveAvatars] = useState<string[]>([]);
  const [loggedUsername, setLoggedUsername] = useState<string | null>(null);
  const [showAccountOverlay, setShowAccountOverlay] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [currentParticipantId, setCurrentParticipantId] = useState<
    string | null
  >(null);
  const [showEndRaceToast, setShowEndRaceToast] = useState(false);
  const [cooldownToast, setCooldownToast] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [isAddCooldownActive, setIsAddCooldownActive] = useState(false);
  const lastAddAtRef = useRef<number | null>(null);
  const cooldownToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const addCooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const getItemLabel = (count: number) => {
    if (!race) return "";
    const labels = {
      pizza: count === 1 ? "pedaço" : "pedaços",
      sushi: count === 1 ? "peça" : "peças",
      burger: count === 1 ? "burger" : "burgers",
    };
    return labels[race.food_type as keyof typeof labels] || "unidades";
  };

  const loadRoomData = async () => {
    // ... (lógica de carregamento permanece igual)
    try {
      const supabase = createClient();
      const { data: raceData } = await supabase
        .from("races")
        .select()
        .eq("room_code", roomCode)
        .single();

      if (!raceData) {
        router.push("/");
        return;
      }

      setRace(raceData);

      const { data: participantsData } = await supabase
        .from("participants")
        .select()
        .eq("race_id", raceData.id)
        .order("items_eaten", { ascending: false });

      if (participantsData) {
        setParticipants(participantsData);
        if (!isSpectator) {
          const storageKey = getParticipantStorageKey(roomCode);
          const storedId = localStorage.getItem(storageKey);
          if (storedId) {
            setCurrentParticipantId(storedId);
          } else {
            const loginCode = localStorage.getItem(LOGIN_STORAGE_KEY);
            const normalizedLogin = loginCode?.trim().toUpperCase();
            if (normalizedLogin) {
              const match = participantsData.find((participant) => {
                const loginMatch = participant.login_code?.trim().toUpperCase();
                const nameMatch = participant.name?.trim().toUpperCase();
                return (
                  loginMatch === normalizedLogin ||
                  nameMatch === normalizedLogin
                );
              });
              if (match) {
                setCurrentParticipantId(match.id);
                localStorage.setItem(storageKey, match.id);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateCount = async (participantId: string, change: number) => {
    if (participantId !== currentParticipantId || !race?.is_active) return;
    const p = participants.find((item) => item.id === participantId);
    if (!p) return;

    const newCount = Math.max(0, p.items_eaten + change);
    await createClient()
      .from("participants")
      .update({ items_eaten: newCount })
      .eq("id", participantId);
  };

  const showCooldownMessage = (event?: MouseEvent<HTMLButtonElement>) => {
    // ATUALIZADO: Usando array de mensagens traduzidas
    const messages = t.room.cooldown_messages;
    const message = messages[Math.floor(Math.random() * messages.length)];
    const fallbackX = Math.round(window.innerWidth / 2);
    const fallbackY = Math.round(window.innerHeight / 2);
    setCooldownToast({
      text: message,
      x: event?.clientX ?? fallbackX,
      y: event?.clientY ?? fallbackY,
    });
    if (cooldownToastTimeoutRef.current) {
      clearTimeout(cooldownToastTimeoutRef.current);
    }
    cooldownToastTimeoutRef.current = setTimeout(() => {
      setCooldownToast(null);
    }, 1000);
  };

  // ... (funções handleUpdateCount, updateAvatar, updateTeam, endRace permanecem iguais)
  const handleUpdateCount = async (
    participantId: string,
    change: number,
    event?: MouseEvent<HTMLButtonElement>,
  ) => {
    if (change > 0) {
      const now = Date.now();
      const lastAddAt = lastAddAtRef.current ?? 0;
      const remaining = addCooldownMs - (now - lastAddAt);
      if (remaining > 0) {
        showCooldownMessage(event);
        return;
      }
      lastAddAtRef.current = now;
      setIsAddCooldownActive(true);
      if (addCooldownTimeoutRef.current) {
        clearTimeout(addCooldownTimeoutRef.current);
      }
      addCooldownTimeoutRef.current = setTimeout(() => {
        setIsAddCooldownActive(false);
      }, addCooldownMs);
    }

    await updateCount(participantId, change);
  };

  const updateAvatar = async (avatar: string) => {
    if (!currentParticipantId || isUpdatingAvatar) return;
    setIsUpdatingAvatar(true);
    try {
      const supabase = createClient();
      await supabase
        .from("participants")
        .update({ avatar })
        .eq("id", currentParticipantId);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const updateTeam = async (teamId: string) => {
    if (!currentParticipantId || isUpdatingAvatar) return;
    setIsUpdatingAvatar(true);
    try {
      const supabase = createClient();
      await supabase
        .from("participants")
        .update({ team: teamId })
        .eq("id", currentParticipantId);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const endRace = async () => {
    if (!race) return;
    setIsEnding(true);
    try {
      const supabase = createClient();
      await supabase
        .from("races")
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq("id", race.id);

      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      await loadRoomData();
    } finally {
      setIsEnding(false);
    }
  };

  const handleEndRace = () => {
    if (isEnding) return;
    setShowEndRaceToast(true);
  };

  const confirmEndRace = async () => {
    if (isEnding) return;
    await endRace();
    setShowEndRaceToast(false);
  };

  const toggleAccountOverlay = () => {
    setShowAccountOverlay((prev) => {
      const next = !prev;
      if (!next) {
        setShowPasswordForm(false);
        setPasswordStatus(null);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem(LOGIN_STORAGE_KEY);
    setShowAccountOverlay(false);
    setShowPasswordForm(false);
    setPasswordStatus(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    router.push("/");
  };

  const handleChangePassword = async () => {
    if (!loggedUsername) return;
    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmNewPassword.trim();
    if (!trimmedCurrent || !trimmedNew || !trimmedConfirm) {
      setPasswordStatus("Preencha todos os campos.");
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setPasswordStatus("As novas senhas nao conferem.");
      return;
    }
    if (trimmedNew.length < 6) {
      setPasswordStatus("A nova senha precisa de pelo menos 6 caracteres.");
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordStatus(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("change_login_password", {
        p_username: loggedUsername.trim().toUpperCase(),
        p_old_password: trimmedCurrent,
        p_new_password: trimmedNew,
      });

      if (error || !data) {
        setPasswordStatus("Senha atual incorreta.");
        return;
      }

      setPasswordStatus("Senha atualizada com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowPasswordForm(false);
    } catch {
      setPasswordStatus("Nao foi possivel atualizar a senha.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  useEffect(() => {
    loadRoomData();
    if (isSpectator) {
      setCurrentParticipantId(null);
    } else {
      const storedId = localStorage.getItem(getParticipantStorageKey(roomCode));
      setCurrentParticipantId(storedId);
    }
    const storedLogin = localStorage.getItem(LOGIN_STORAGE_KEY);
    setLoggedUsername(storedLogin || null);

    const supabase = createClient();
    const channel = supabase
      .channel(`room:${roomCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants" },
        () => loadRoomData(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "races" },
        () => loadRoomData(),
      )
      .subscribe();

    return () => {
      if (cooldownToastTimeoutRef.current) {
        clearTimeout(cooldownToastTimeoutRef.current);
      }
      if (addCooldownTimeoutRef.current) {
        clearTimeout(addCooldownTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [roomCode, isSpectator]);

  const currentParticipant = participants.find(
    (p) => p.id === currentParticipantId,
  );

  useEffect(() => {
    let isMounted = true;
    const loadPlayerEntitlements = async () => {
      // ... (lógica original)
      const loginCode = currentParticipant?.login_code?.trim().toUpperCase();
      if (!loginCode) {
        if (isMounted) {
          setIsPremiumPlayer(false);
          setExclusiveAvatars([]);
        }
        return;
      }

      try {
        const supabase = createClient();
        const { data: profileData, error: profileError } = await supabase
          .from("player_profiles")
          .select("is_premium")
          .eq("login_code", loginCode)
          .maybeSingle();

        if (!profileError && isMounted) {
          setIsPremiumPlayer(!!profileData?.is_premium);
        }

        const { data: exclusiveData, error: exclusiveError } = await supabase
          .from("exclusive_avatars")
          .select("avatar")
          .eq("login_code", loginCode);

        if (!exclusiveError && isMounted) {
          setExclusiveAvatars(
            Array.isArray(exclusiveData)
              ? exclusiveData.map((row) => row.avatar)
              : [],
          );
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setIsPremiumPlayer(false);
          setExclusiveAvatars([]);
        }
      }
    };

    loadPlayerEntitlements();
    return () => {
      isMounted = false;
    };
  }, [currentParticipant?.login_code]);

  if (loading) return <LoadingScreen />;
  if (!race) return null;

  const maxScore = Math.max(...participants.map((p) => p.items_eaten), 0);

  if (!race.is_active) {
    return (
      <HallOfFame
        race={race}
        participants={participants}
        maxScore={maxScore}
        getItemLabel={getItemLabel}
        onHome={() => router.push("/")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-orange-100/50 via-background to-background dark:from-purple-950/50 dark:via-black dark:to-black p-4 md:p-8 text-[15px] md:text-base">
      <div className="mx-auto max-w-2xl space-y-6">
        <RoomHeader
          onExit={() => router.push("/")}
          accountPill={
            loggedUsername ? (
              <button
                type="button"
                onClick={toggleAccountOverlay}
                className="inline-flex items-center rounded-xl border border-muted/60 bg-background/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur transition hover:border-primary/40 hover:text-primary"
              >
                <Settings className="mr-2 h-3.5 w-3.5" />
                {t.common.connected_as} &quot;{loggedUsername}&quot;
              </button>
            ) : null
          }
        />

        <RoomInfo
          race={race}
          participantsCount={participants.length}
          roomCode={roomCode}
          copied={copied}
          onCopyCode={() => {
            navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        />

        {currentParticipant?.is_vip && (
          <div className="flex justify-center">
            <Button
              variant="destructive"
              className="w-full max-w-xs rounded-xl font-bold shadow-lg shadow-destructive/20 cursor-pointer transition-all hover:scale-105"
              onClick={handleEndRace}
              disabled={isEnding}
            >
              {isEnding ? t.room.ending : t.room.end_race}
            </Button>
          </div>
        )}

        {race.is_team_mode &&
          currentParticipant &&
          !currentParticipant.team && (
            <TeamSelection
              onUpdateTeam={updateTeam}
              isUpdating={isUpdatingAvatar}
            />
          )}

        {currentParticipant && (
          <PersonalProgress
            participant={currentParticipant}
            getItemLabel={getItemLabel}
            onUpdateCount={handleUpdateCount}
            onUpdateAvatar={updateAvatar}
            isUpdatingAvatar={isUpdatingAvatar}
            isAddCooldown={isAddCooldownActive}
            isPremium={isPremiumPlayer}
            exclusiveAvatars={exclusiveAvatars}
          />
        )}

        {participants.length > 0 && (
          <RaceTrack
            participants={participants}
            isTeamMode={race.is_team_mode}
          />
        )}

        <RankingSection
          race={race}
          participants={participants}
          currentParticipantId={currentParticipantId}
          getItemLabel={getItemLabel}
        />

      </div>

      {currentParticipant && (
        <div className="fixed right-6 flex flex-col items-end gap-2 pb-[env(safe-area-inset-bottom)] bottom-6">
          <Button
            size="icon"
            className={`h-14 w-14 rounded-full shadow-xl shadow-primary/30 ${
              isAddCooldownActive ? "opacity-50 grayscale" : ""
            }`}
            onClick={(event) =>
              handleUpdateCount(currentParticipant.id, 1, event)
            }
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
      <div className="fixed left-4 bottom-4 sm:left-6 sm:bottom-6 pb-[env(safe-area-inset-bottom)] z-40">
        <Button
          variant="outline"
          onClick={() => router.push("/")}
          className="rounded-xl font-semibold gap-2 shadow-sm bg-background/90 backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.common.exit}
        </Button>
      </div>
      {loggedUsername && showAccountOverlay && (
        <>
          <div
            className={`fixed inset-0 z-30 transition ${
              showPasswordForm
                ? "bg-black/40 backdrop-blur-sm"
                : "bg-transparent"
            }`}
            onClick={toggleAccountOverlay}
          />
          <div className="fixed left-3 top-14 z-40 w-[min(320px,calc(100%-1.5rem))] space-y-3 rounded-2xl border border-muted/60 bg-background/95 p-4 shadow-xl backdrop-blur">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="flex-1 min-w-[140px]"
                onClick={() => {
                  setShowPasswordForm((prev) => !prev);
                  setPasswordStatus(null);
                }}
              >
                {t.account.change_password}
              </Button>
              <Button
                variant="ghost"
                className="flex-1 min-w-[120px]"
                onClick={handleLogout}
              >
                {t.account.logout}
              </Button>
            </div>
            {showPasswordForm && (
              <div className="space-y-2 rounded-xl border border-muted/60 bg-background/70 p-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">
                    {t.account.current_password}
                  </Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-10"
                    placeholder="***"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">
                    {t.account.new_password}
                  </Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10"
                    placeholder="***"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">
                    {t.account.confirm_password}
                  </Label>
                  <Input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="h-10"
                    placeholder="***"
                  />
                </div>
                {passwordStatus && (
                  <p className="text-xs text-muted-foreground font-semibold">
                    {passwordStatus}
                  </p>
                )}
                <Button
                  className="w-full h-10 rounded-xl font-bold"
                  onClick={handleChangePassword}
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword
                    ? t.account.updating
                    : t.account.update_password}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
      {cooldownToast && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-full bg-amber-100 px-4 py-2 text-center text-sm font-semibold leading-snug text-amber-800 shadow-sm md:text-[11px]"
          style={{ left: cooldownToast.x, top: cooldownToast.y }}
        >
          {cooldownToast.text}
        </div>
      )}
      {showEndRaceToast && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-muted/60 bg-background/95 p-4 shadow-xl backdrop-blur-sm">
            <p className="text-sm font-semibold text-foreground">
              {t.room.confirm_end_title}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t.room.confirm_end_desc}
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowEndRaceToast(false)}
                disabled={isEnding}
              >
                {t.room.cancel}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmEndRace}
                disabled={isEnding}
              >
                {isEnding ? t.room.ending : t.room.confirm}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

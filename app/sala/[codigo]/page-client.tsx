"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ChangeEvent,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  ArrowLeft,
  Settings,
  Check,
  Copy,
  UserPlus,
  Camera,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

import { RoomHeader } from "@/components/room/room-header";
import { RoomInfo } from "@/components/room/room-info";
import { PersonalProgress } from "@/components/room/personal-progress";
import { RankingSection } from "@/components/room/ranking-section";
import { HallOfFame } from "@/components/room/hall-of-fame";
import { RaceTrack } from "@/components/room/race-track";
import { LoadingScreen } from "@/components/room/loading-screen";
import { JoinRoomViaLink } from "@/components/room/join-room-via-link"; // NOVO IMPORT
import { PhotoFeed } from "@/components/room/photo-feed";

import { getParticipantStorageKey } from "@/lib/utils/participant-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import type { Race, Participant } from "@/types/database";
import { TeamSelection } from "@/components/room/team-selection";
import { useLanguage } from "@/contexts/language-context";
import { getFoodTypeUnit } from "@/lib/utils/food-type";

export default function RoomPage() {
  const { t, language } = useLanguage();
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

  // States existentes
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
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const [showConnectOverlay, setShowConnectOverlay] = useState(false);
  const [accountFlow, setAccountFlow] = useState<"login" | "create">("login");
  const [accountUsername, setAccountUsername] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [nameStatus, setNameStatus] = useState<string | null>(null);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showAddToHomeHelp, setShowAddToHomeHelp] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimCode, setClaimCode] = useState("");
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [promoPermissions, setPromoPermissions] = useState<string[]>([]);
  const [needsJoinPrompt, setNeedsJoinPrompt] = useState(true);
  const [raceView, setRaceView] = useState<"live" | "photos">("live");
  const [hasPhotoTimeline, setHasPhotoTimeline] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [currentParticipantId, setCurrentParticipantId] = useState<
    string | null
  >(null);
  const [showEndRaceToast, setShowEndRaceToast] = useState(false);
  const [showManageMenu, setShowManageMenu] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Participant | null>(null);
  const [isRemovingPlayer, setIsRemovingPlayer] = useState(false);
  const [cooldownToast, setCooldownToast] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [isAddCooldownActive, setIsAddCooldownActive] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoSendStatus, setPhotoSendStatus] = useState<
    "success" | "error" | null
  >(null);
  const photoSendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [photoTarget, setPhotoTarget] = useState<{
    participantId: string;
    itemNumber: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isPhotoModeEnabled = !!race?.photo_mode;
  const isPhotoRequired = !!race?.photo_mode && !!race?.photo_required;

  useEffect(() => {
    if (!isPhotoModeEnabled || !race?.room_code || !currentParticipantId) {
      setHasPhotoTimeline(false);
      return;
    }
    let ignore = false;
    fetch(
      `/api/race-photos/timeline?roomCode=${encodeURIComponent(
        race.room_code,
      )}&participantId=${encodeURIComponent(currentParticipantId)}`,
    )
      .then((response) => {
        if (response.status === 403) return { photos: [] };
        return response.json().catch(() => ({ photos: [] }));
      })
      .then((data) => {
        if (ignore) return;
        const photos = Array.isArray(data?.photos) ? data.photos : [];
        setHasPhotoTimeline(photos.length > 0);
      })
      .catch(() => {
        if (!ignore) setHasPhotoTimeline(false);
      });
    return () => {
      ignore = true;
    };
  }, [isPhotoModeEnabled, race?.room_code, currentParticipantId]);

  useEffect(() => {
    if (!hasPhotoTimeline && raceView === "photos") {
      setRaceView("live");
    }
  }, [hasPhotoTimeline, raceView]);

  const handleCopyCode = () => {
    const lang =
      language ?? localStorage.getItem("rodizio-lang") ?? "pt";
    const url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const handleExit = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  const lastAddAtRef = useRef<number | null>(null);
  const cooldownToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const addCooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const formatAccountLabel = (value: string) =>
    value.length > 16 ? `${value.slice(0, 16)}...` : value;

  const loadPromoPermissions = async () => {
    if (!loggedUsername) {
      setPromoPermissions([]);
      return;
    }
    setIsLoadingPermissions(true);
    try {
      const response = await fetch(
        `/api/promo-codes/permissions?loginCode=${encodeURIComponent(
          loggedUsername.trim().toUpperCase(),
        )}`,
      );
      const data = await response.json().catch(() => ({}));
      const avatars = Array.isArray(data?.avatars) ? data.avatars : [];
      setPromoPermissions(avatars);
    } catch {
      setPromoPermissions([]);
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const handleClaimExclusiveAvatar = async () => {
    if (!loggedUsername) return;
    const trimmedCode = claimCode.trim();
    if (!trimmedCode) {
      setClaimStatus("Digite o codigo.");
      return;
    }
    setIsClaiming(true);
    setClaimStatus(null);
    try {
      const response = await fetch("/api/exclusive-avatars/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginCode: loggedUsername.trim().toUpperCase(),
          code: trimmedCode,
        }),
      });
      const data = await response.json().catch(() => ({}));
      const status = String(data?.status || "");
      if (status === "claimed") {
        setClaimStatus(`Avatar registrado: ${data?.avatar ?? ""}`.trim());
        setClaimCode("");
        return;
      }
      setClaimStatus("Erro ao registrar.");
    } catch {
      setClaimStatus("Nao foi possivel registrar o avatar.");
    } finally {
      setIsClaiming(false);
    }
  };

  const getItemLabel = (count: number) => {
    if (!race) return "";
    return getFoodTypeUnit(race.food_type, language, count) || "unidades";
  };

  const loadRoomData = async () => {
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
        let resolvedParticipantId: string | null = null;
        if (!isSpectator) {
          const storageKey = getParticipantStorageKey(roomCode);
          const storedId = localStorage.getItem(storageKey);

          if (storedId) {
            const isValid = participantsData.some((p) => p.id === storedId);
            if (isValid) {
              resolvedParticipantId = storedId;
            } else {
              localStorage.removeItem(storageKey);
            }
          }

          if (!resolvedParticipantId) {
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
                resolvedParticipantId = match.id;
                localStorage.setItem(storageKey, match.id);
              }
            }
          }
        }

        setCurrentParticipantId(resolvedParticipantId);

        if (raceData.photo_mode && raceData.room_code && resolvedParticipantId) {
          try {
            const response = await fetch(
              `/api/race-photos/timeline?roomCode=${encodeURIComponent(
                raceData.room_code,
              )}&participantId=${encodeURIComponent(resolvedParticipantId)}`,
            );
            const data =
              response.status === 403
                ? { photos: [] }
                : await response.json().catch(() => ({ photos: [] }));
            const photos = Array.isArray(data?.photos) ? data.photos : [];
            setHasPhotoTimeline(photos.length > 0);
          } catch (error) {
            console.error(error);
            setHasPhotoTimeline(false);
          }
        } else {
          setHasPhotoTimeline(false);
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
    const messages = t.room.cooldown_messages;
    const message = messages[Math.floor(Math.random() * messages.length)];
    const fallbackX = Math.round(window.innerWidth / 2);
    const fallbackY = Math.round(window.innerHeight / 2);
    setCooldownToast({
      text: message,
      x: (event?.clientX ?? fallbackX) - 28,
      y: event?.clientY ?? fallbackY,
    });
    if (cooldownToastTimeoutRef.current) {
      clearTimeout(cooldownToastTimeoutRef.current);
    }
    cooldownToastTimeoutRef.current = setTimeout(() => {
      setCooldownToast(null);
    }, 1500);
  };

  const checkAddCooldown = (event?: MouseEvent<HTMLButtonElement>) => {
    const now = Date.now();
    const lastAddAt = lastAddAtRef.current ?? 0;
    const remaining = addCooldownMs - (now - lastAddAt);
    if (remaining > 0) {
      showCooldownMessage(event);
      return false;
    }
    lastAddAtRef.current = now;
    setIsAddCooldownActive(true);
    if (addCooldownTimeoutRef.current) {
      clearTimeout(addCooldownTimeoutRef.current);
    }
    addCooldownTimeoutRef.current = setTimeout(() => {
      setIsAddCooldownActive(false);
    }, addCooldownMs);
    return true;
  };

  const handlePhotoIncrement = (
    participantId: string,
    event?: MouseEvent<HTMLButtonElement>,
  ) => {
    if (!race) return;
    const participant = participants.find((item) => item.id === participantId);
    if (race.is_team_mode && !participant?.team) {
      toast.error(
        t.room.choose_team_required ?? "Escolha um time para jogar.",
      );
      return;
    }
    if (!checkAddCooldown(event)) return;
    if (!loggedUsername) {
      toast.error("Fa??a login para usar o modo foto.");
      return;
    }
    if (!participant?.login_code) {
      toast.error("Voc?? precisa estar logado para usar o modo foto.");
      return;
    }
    if (isUploadingPhoto) return;
    const nextCount = Math.max(0, participant.items_eaten + 1);
    setPhotoTarget({ participantId, itemNumber: nextCount });
    fileInputRef.current?.click();
  };

  const handleUpdateCount = async (
    participantId: string,
    change: number,
    event?: MouseEvent<HTMLButtonElement>,
  ) => {
    if (change > 0 && race?.is_team_mode) {
      const participant = participants.find((item) => item.id === participantId);
      if (!participant?.team) {
        toast.error(
          t.room.choose_team_required ?? "Escolha um time para jogar.",
        );
        return;
      }
    }
    if (change > 0 && isPhotoRequired) {
      handlePhotoIncrement(participantId, event);
      return;
    }

    if (change > 0 && !checkAddCooldown(event)) {
      return;
    }

    await updateCount(participantId, change);
  };

  const handlePhotoSelected = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !photoTarget || !race) {
      setPhotoTarget(null);
      return;
    }

    const compressImage = async (input: File) => {
      if (input.type === "image/gif") return input;
      const maxSize = 1024;
      let quality = 0.7;
      let bitmap: ImageBitmap | null = null;
      try {
        bitmap = await createImageBitmap(input);
        let ratio = Math.min(
          1,
          maxSize / Math.max(bitmap.width, bitmap.height)
        );
        let blob: Blob | null = null;
        let targetWidth = Math.round(bitmap.width * ratio);
        let targetHeight = Math.round(bitmap.height * ratio);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return input;

        for (let attempt = 0; attempt < 5; attempt += 1) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          ctx.clearRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
          blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", quality)
          );
          if (blob && blob.size <= 1_000_000) break;
          quality = Math.max(0.5, quality - 0.1);
          ratio = ratio * 0.85;
          targetWidth = Math.max(320, Math.round(bitmap.width * ratio));
          targetHeight = Math.max(320, Math.round(bitmap.height * ratio));
        }

        if (!blob) return input;
        return new File([blob], input.name.replace(/\.\w+$/, ".jpg"), {
          type: "image/jpeg",
        });
      } catch {
        return input;
      } finally {
        bitmap?.close();
      }
    };

    if (!loggedUsername) {
      toast.error("Fa??a login para usar o modo foto.");
      setPhotoSendStatus("error");
      setPhotoTarget(null);
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoSendStatus(null);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("roomCode", roomCode);
      formData.append("participantId", photoTarget.participantId);
      formData.append("itemNumber", String(photoTarget.itemNumber));
      formData.append("loginCode", loggedUsername);
      formData.append("file", compressed);

      const response = await fetch("/api/race-photos/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        toast.error("Nao foi possivel enviar a foto.");
        setPhotoSendStatus("error");
        return;
      }

      await updateCount(photoTarget.participantId, 1);
      setPhotoSendStatus("success");
    } catch {
      toast.error("Nao foi possivel enviar a foto.");
      setPhotoSendStatus("error");
    } finally {
      setIsUploadingPhoto(false);
      setPhotoTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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

  const handleRemovePlayer = async () => {
    if (!removeTarget || !race || isRemovingPlayer || !currentParticipantId)
      return;
    setIsRemovingPlayer(true);
    try {
      const response = await fetch("/api/participants/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          requesterId: currentParticipantId,
          targetId: removeTarget.id,
        }),
      });
      if (!response.ok) {
        throw new Error("remove_failed");
      }
      if (removeTarget.id === currentParticipantId) {
        const participantKey = getParticipantStorageKey(roomCode);
        localStorage.removeItem(participantKey);
        setCurrentParticipantId(null);
        setNeedsJoinPrompt(true);
      }
      setRemoveTarget(null);
    } catch {
      toast.error("Nao foi possivel remover o jogador.");
    } finally {
      setIsRemovingPlayer(false);
    }
  };

  const toggleAccountOverlay = () => {
    setShowAccountOverlay((prev) => {
      const next = !prev;
      if (!next) {
        setShowPasswordForm(false);
        setPasswordStatus(null);
        setShowPasswordSuccess(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setShowClaimForm(false);
        setClaimStatus(null);
        setClaimCode("");
      }
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem(LOGIN_STORAGE_KEY);
    const participantKey = getParticipantStorageKey(roomCode);
    localStorage.removeItem(participantKey);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`rodizio-join-prompt-${roomCode}`);
      window.dispatchEvent(new Event("rodizio-login-updated"));
    }
    setLoggedUsername(null);
    setCurrentParticipantId(null);
    setNeedsJoinPrompt(true);
    setShowAccountOverlay(false);
    setShowPasswordForm(false);
    setNameStatus(null);
    setPasswordStatus(null);
    setShowPasswordSuccess(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowClaimForm(false);
    setClaimStatus(null);
    setClaimCode("");
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

      if (error) {
        setPasswordStatus(error.message || "Senha atual incorreta.");
        return;
      }
      if (data === false) {
        setPasswordStatus("Senha atual incorreta.");
        return;
      }

      setPasswordStatus("Senha trocada com sucesso.");
      setShowPasswordSuccess(true);
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

  const handleUpdateName = async (nextName: string) => {
    if (!race || !currentParticipant) return;
    const trimmedName = nextName.trim().toUpperCase();
    if (!trimmedName) {
      setNameStatus(t.room.name_required ?? "Digite um nome valido.");
      return;
    }
    setIsUpdatingName(true);
    setNameStatus(null);
    try {
      const supabase = createClient();
      const { data: conflict } = await supabase
        .from("participants")
        .select("id")
        .eq("race_id", race.id)
        .ilike("name", trimmedName)
        .neq("id", currentParticipant.id)
        .limit(1)
        .maybeSingle();

      if (conflict) {
        setNameStatus(t.room.name_taken ?? "Esse nome ja esta em uso.");
        return;
      }

      const { error } = await supabase
        .from("participants")
        .update({ name: trimmedName })
        .eq("id", currentParticipant.id);

      if (error) {
        setNameStatus(t.account.connect_error);
        return;
      }

      await loadRoomData();
    } catch {
      setNameStatus(t.account.connect_error);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const resetConnectForm = () => {
    setAccountUsername("");
    setAccountPassword("");
    setAccountStatus(null);
  };

  const closeConnectOverlay = () => {
    setShowConnectOverlay(false);
    resetConnectForm();
  };

  const attachLoginToParticipant = async (normalizedUsername: string) => {
    if (!race || !currentParticipant) return;
    const supabase = createClient();
    const { data: existingParticipant } = await supabase
      .from("participants")
      .select("id, items_eaten, avatar, team, name")
      .eq("race_id", race.id)
      .eq("login_code", normalizedUsername)
      .maybeSingle();

    const storageKey = getParticipantStorageKey(roomCode);

    if (existingParticipant && existingParticipant.id !== currentParticipant.id) {
      const itemsToKeep = Math.max(
        existingParticipant.items_eaten ?? 0,
        currentParticipant.items_eaten ?? 0,
      );
      await supabase
        .from("participants")
        .update({
          items_eaten: itemsToKeep,
          avatar: currentParticipant.avatar ?? existingParticipant.avatar,
          team: currentParticipant.team ?? existingParticipant.team,
          name: currentParticipant.name ?? existingParticipant.name,
        })
        .eq("id", existingParticipant.id);
      await supabase
        .from("participants")
        .delete()
        .eq("id", currentParticipant.id);
      localStorage.setItem(storageKey, existingParticipant.id);
      setCurrentParticipantId(existingParticipant.id);
    } else {
      await supabase
        .from("participants")
        .update({ login_code: normalizedUsername })
        .eq("id", currentParticipant.id);
      localStorage.setItem(storageKey, currentParticipant.id);
    }

    localStorage.setItem(LOGIN_STORAGE_KEY, normalizedUsername);
    setLoggedUsername(normalizedUsername);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rodizio-login-updated"));
    }
    await loadRoomData();
  };

  const handleConnectLogin = async () => {
    if (!accountUsername.trim() || !accountPassword.trim()) return;
    setAccountLoading(true);
    setAccountStatus(null);
    try {
      const supabase = createClient();
      const normalizedUsername = accountUsername.trim().toUpperCase();
      const { data, error } = await supabase.rpc("verify_login", {
        p_username: normalizedUsername,
        p_password: accountPassword,
      });

      if (error || !data) {
        setAccountStatus(t.account.invalid_credentials);
        return;
      }

      await attachLoginToParticipant(normalizedUsername);
      closeConnectOverlay();
    } catch (error) {
      console.error(error);
      setAccountStatus(t.account.connect_error);
    } finally {
      setAccountLoading(false);
    }
  };

  const handleConnectCreate = async () => {
    if (!accountUsername.trim() || !accountPassword.trim()) return;
    if (accountPassword.trim().length < 6) {
      setAccountStatus(t.account.password_too_short);
      return;
    }
    setAccountLoading(true);
    setAccountStatus(null);
    try {
      const supabase = createClient();
      const normalizedUsername = accountUsername.trim().toUpperCase();
      const { data, error } = await supabase.rpc("create_login", {
        p_username: normalizedUsername,
        p_password: accountPassword,
      });
      if (error || !data) {
        setAccountStatus(t.account.create_error);
        return;
      }

      await attachLoginToParticipant(normalizedUsername);
      closeConnectOverlay();
    } catch (error) {
      console.error(error);
      setAccountStatus(t.account.connect_error);
    } finally {
      setAccountLoading(false);
    }
  };

  useEffect(() => {
    loadRoomData();
    const storedLogin = localStorage.getItem(LOGIN_STORAGE_KEY);
    setLoggedUsername(storedLogin || null);
    if (typeof document !== "undefined") {
      document.title = `Sala ${roomCode}`;
    }
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      const isIos = /iphone|ipad|ipod/.test(ua);
      const standaloneMatch = window.matchMedia?.("(display-mode: standalone)");
      const standalone =
        (window.navigator as any).standalone === true ||
        (standaloneMatch?.matches ?? false);
      setIsIosDevice(isIos);
      setIsStandalone(standalone);
    }

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
      if (photoSendTimeoutRef.current) {
        clearTimeout(photoSendTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [roomCode, isSpectator]);

  useEffect(() => {
    if (!photoSendStatus) return;
    if (photoSendTimeoutRef.current) {
      clearTimeout(photoSendTimeoutRef.current);
    }
    photoSendTimeoutRef.current = setTimeout(() => {
      setPhotoSendStatus(null);
    }, 1400);
  }, [photoSendStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const joinPromptKey = `rodizio-join-prompt-${roomCode}`;
    const hasJoined = sessionStorage.getItem(joinPromptKey);
    setNeedsJoinPrompt(!hasJoined);
  }, [roomCode]);

  useEffect(() => {
    const handleLoginUpdated = () => {
      const storedLogin = localStorage.getItem(LOGIN_STORAGE_KEY);
      setLoggedUsername(storedLogin || null);
    };
    window.addEventListener("rodizio-login-updated", handleLoginUpdated);
    return () => {
      window.removeEventListener("rodizio-login-updated", handleLoginUpdated);
    };
  }, []);

  useEffect(() => {
    loadPromoPermissions();
  }, [loggedUsername]);

  const currentParticipant = participants.find(
    (p) => p.id === currentParticipantId,
  );

  useEffect(() => {
    let isMounted = true;
    const loadPlayerEntitlements = async () => {
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
        currentParticipantId={currentParticipantId}
        onReopenRace={loadRoomData}
      />
    );
  }

  const handleJoinFromInvite = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`rodizio-join-prompt-${roomCode}`, "1");
    }
    setNeedsJoinPrompt(false);
    loadRoomData();
  };

  // --- ALTERA????O AQUI: Se n??o estiver participando, mostra o novo componente ---
  if (!isSpectator && needsJoinPrompt && !currentParticipantId) {
    return (
      <JoinRoomViaLink
        race={race}
        roomCode={roomCode}
        onJoin={handleJoinFromInvite}
        onBack={() => router.push("/")}
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
                className="inline-flex items-center rounded-xl border border-muted/60 bg-background/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur transition hover:border-primary/40 hover:text-primary whitespace-nowrap"
              >
                <Settings className="mr-2 h-3.5 w-3.5" />
                {formatAccountLabel(loggedUsername)}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAccountFlow("login");
                  setShowConnectOverlay(true);
                  setAccountStatus(null);
                }}
                className="inline-flex items-center rounded-xl border border-muted/60 bg-background/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur transition hover:border-primary/40 hover:text-primary"
              >
                <UserPlus className="mr-2 h-3.5 w-3.5" />
                {t.account.connect_pill}
              </button>
            )
          }
        />

        {/* Room Info, etc. (C??digo original mantido abaixo) */}
        <RoomInfo
          race={race}
          participantsCount={participants.length}
          roomCode={roomCode}
          copied={copied}
          onCopyCode={handleCopyCode}
        />

        {/* Bot??o de Encerrar (Apenas VIP) */}
        {currentParticipant?.is_vip ? (
          <div className="flex justify-center">
            <div className="relative flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl font-bold shadow-lg cursor-pointer transition-all hover:scale-105"
                onClick={() => setShowManageMenu((prev) => !prev)}
              >
                {t.room.manage_players ?? "Gerenciar jogadores"}
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl font-bold shadow-lg shadow-destructive/20 cursor-pointer transition-all hover:scale-105"
                onClick={handleEndRace}
                disabled={isEnding}
              >
                {isEnding ? t.room.ending : t.room.end_race}
              </Button>
              {showManageMenu && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-30"
                    onClick={() => setShowManageMenu(false)}
                    aria-label="Close"
                  />
                  <div className="absolute left-0 right-0 top-full z-40 mt-2 w-full rounded-2xl border border-muted/60 bg-background/95 p-3 shadow-xl">
                    <p className="px-1 pb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {t.common.players ?? "Jogadores"}
                    </p>
                    <div className="max-h-64 overflow-auto space-y-1">
                      {participants.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-lg px-2 py-1 text-xs"
                        >
                          <span className="font-semibold truncate">
                            {p.name}
                          </span>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-[10px] font-black uppercase"
                            onClick={() => {
                              setShowManageMenu(false);
                              setRemoveTarget(p);
                            }}
                            disabled={p.id === currentParticipantId}
                          >
                            {t.room.remove_player ?? "Remover"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <p className="text-xs font-semibold text-primary/80">
              {t.room.vip_only_end}
            </p>
          </div>
        )}

        {/* Sele????o de Time */}
        {race.is_team_mode &&
          currentParticipant &&
          !currentParticipant.team && (
            <TeamSelection
              onUpdateTeam={updateTeam}
              isUpdating={isUpdatingAvatar}
            />
          )}

        {/* Progresso Pessoal (Controle principal) */}
        {currentParticipant && (
          <PersonalProgress
            participant={currentParticipant}
            getItemLabel={getItemLabel}
            onUpdateCount={handleUpdateCount}
            onUpdateAvatar={updateAvatar}
            onUpdateName={handleUpdateName}
            nameStatus={nameStatus}
            isUpdatingName={isUpdatingName}
            isUpdatingAvatar={isUpdatingAvatar}
            isAddCooldown={isAddCooldownActive}
            isUploadingPhoto={isUploadingPhoto}
            photoSendStatus={photoSendStatus}
            photoModeEnabled={isPhotoModeEnabled}
            photoRequired={isPhotoRequired}
            addCooldownMs={addCooldownMs}
            onPhotoIncrement={handlePhotoIncrement}
            isLoggedIn={!!loggedUsername}
            isPremium={isPremiumPlayer}
            exclusiveAvatars={exclusiveAvatars}
          />
        )}

        {hasPhotoTimeline && (
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-muted/60 bg-background/70 p-1">
            <button
              type="button"
              onClick={() => setRaceView("live")}
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
              onClick={() => setRaceView("photos")}
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
                    onClick={handleCopyCode}
                    className="h-9 w-9 rounded-xl border border-muted/50 bg-background/80 hover:cursor-pointer"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
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
      </div>

      {currentParticipant && (
        <div className="fixed right-6 flex flex-col items-end gap-2 pb-[env(safe-area-inset-bottom)] bottom-6 z-50">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelected}
          />
          <Button
            size="icon"
            className={`relative h-14 w-14 overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/90 via-primary to-primary/70 text-white shadow-[0_16px_35px_rgba(0,0,0,0.22)] backdrop-blur transition-all duration-200 hover:scale-105 active:scale-95 ${
              isAddCooldownActive || isUploadingPhoto ? "opacity-50 grayscale" : ""
            }`}
            onClick={(event) =>
              isPhotoRequired
                ? handlePhotoIncrement(currentParticipant.id, event)
                : handleUpdateCount(currentParticipant.id, 1, event)
            }
            disabled={isUploadingPhoto}
          >
            {isAddCooldownActive && (
              <span
                className="pointer-events-none absolute inset-0 bg-white/20 cooldown-fill"
                style={{ "--cooldown-duration": `${addCooldownMs}ms` }}
              />
            )}
            {isPhotoRequired ? (
              <div className="relative z-10 flex flex-col items-center leading-none">
                <Camera className="h-5 w-5" />
                <span className="text-[10px] font-black">+1</span>
              </div>
            ) : (
              <span className="relative z-10 text-lg font-black leading-none">
                +1
              </span>
            )}
          </Button>
          </div>
        )}

      <div className="fixed left-4 bottom-4 sm:left-6 sm:bottom-6 pb-[env(safe-area-inset-bottom)] z-40">
        <Button
          variant="outline"
          onClick={handleExit}
          className="rounded-xl font-semibold gap-2 shadow-sm bg-background/90 backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.common.exit}
        </Button>
      </div>

      {/* OVERLAYS E MODAIS (Settings, Logout, etc) */}
      {removeTarget && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setRemoveTarget(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm space-y-4 rounded-2xl border border-muted/60 bg-background/95 p-5 shadow-xl">
              <div className="space-y-1 text-center">
                <h2 className="text-lg font-bold">
                  {t.room.confirm_remove_title ?? "Remover jogador?"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {(t.room.confirm_remove_desc ??
                    "Tem certeza que deseja remover {name} da corrida?"
                  ).replace("{name}", removeTarget.name)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setRemoveTarget(null)}
                  disabled={isRemovingPlayer}
                >
                  {t.room.cancel}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleRemovePlayer}
                  disabled={isRemovingPlayer}
                >
                  {t.room.remove_player ?? "Remover"}
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
      {!loggedUsername && showConnectOverlay && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
            onClick={closeConnectOverlay}
          />
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm space-y-4 rounded-2xl border border-muted/60 bg-background/95 p-5 shadow-xl">
              <div className="space-y-1 text-center">
                <h2 className="text-lg font-bold">{t.account.connect_title}</h2>
                <p className="text-sm text-muted-foreground">
                  {t.account.connect_description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-1 text-xs font-bold uppercase">
                <button
                  type="button"
                  className={`rounded-lg py-2 transition ${
                    accountFlow === "login"
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setAccountFlow("login");
                    setAccountStatus(null);
                  }}
                >
                  {t.account.login_tab}
                </button>
                <button
                  type="button"
                  className={`rounded-lg py-2 transition ${
                    accountFlow === "create"
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => {
                    setAccountFlow("create");
                    setAccountStatus(null);
                  }}
                >
                  {t.account.create_tab}
                </button>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>{t.account.username_label}</Label>
                <Input
                  value={accountUsername}
                  onChange={(event) => setAccountUsername(event.target.value)}
                  placeholder={t.account.username_placeholder}
                  maxLength={20}
                />
                </div>
                <div className="space-y-2">
                  <Label>{t.account.password_label}</Label>
                  <Input
                    type="password"
                    value={accountPassword}
                    onChange={(event) => setAccountPassword(event.target.value)}
                    placeholder={t.account.password_placeholder}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      if (accountFlow === "login") {
                        handleConnectLogin();
                      } else {
                        handleConnectCreate();
                      }
                    }}
                  />
                </div>
                {accountStatus && (
                  <p className="text-xs text-destructive">{accountStatus}</p>
                )}
                <Button
                  className="w-full"
                  disabled={
                    accountLoading ||
                    !accountUsername.trim() ||
                    !accountPassword.trim()
                  }
                  onClick={
                    accountFlow === "login"
                      ? handleConnectLogin
                      : handleConnectCreate
                  }
                >
                  {accountLoading
                    ? t.common.loading
                    : accountFlow === "login"
                    ? t.account.login_btn
                    : t.account.create_btn}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={closeConnectOverlay}
                >
                  {t.common.back}
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}

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
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowClaimForm((prev) => !prev);
                setClaimStatus(null);
              }}
            >
              {showClaimForm ? t.common.back : t.account.register_avatar}
            </Button>
            {!isLoadingPermissions && promoPermissions.length > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowAccountOverlay(false);
                  router.push("/codigos-promocionais");
                }}
              >
                {t.account.manage_codes}
              </Button>
            )}
            {/* ... restante do overlay de conta */}
            {isIosDevice && !isStandalone && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAddToHomeHelp(true)}
              >
                {t.common.add_to_home}
              </Button>
            )}
            {showClaimForm && (
              <div className="space-y-2 rounded-xl border border-muted/60 bg-background/70 p-3">
                <Label className="text-xs uppercase font-bold text-muted-foreground">
                  Codigo de resgate
                </Label>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Input
                    value={claimCode}
                    onChange={(e) => setClaimCode(e.target.value)}
                    className="h-10"
                    placeholder="EX: BETA-2025-01"
                  />
                  <Button
                    className="h-10 md:w-40"
                    onClick={handleClaimExclusiveAvatar}
                    disabled={isClaiming}
                  >
                    {isClaiming ? "..." : "OK"}
                  </Button>
                </div>
                {claimStatus && (
                  <p className="text-xs text-muted-foreground font-semibold">
                    {claimStatus}
                  </p>
                )}
              </div>
            )}
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

      {/* TOASTS E MODAIS AUXILIARES */}
      {cooldownToast && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-full bg-amber-100 px-4 py-2 text-center text-sm font-semibold leading-snug text-amber-800 shadow-sm md:text-[11px]"
          style={{ left: cooldownToast.x, top: cooldownToast.y }}
        >
          {cooldownToast.text}
        </div>
      )}

      {showPasswordSuccess && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-muted/60 bg-background/95 p-4 text-center shadow-xl backdrop-blur">
            <p className="text-sm font-semibold text-foreground">
              Senha trocada com sucesso
            </p>
            <Button
              className="mt-3 w-full h-10 rounded-xl font-bold"
              onClick={() => setShowPasswordSuccess(false)}
            >
              OK
            </Button>
          </div>
        </>
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

      {showAddToHomeHelp && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-muted/60 bg-background/95 p-4 text-center shadow-xl backdrop-blur">
            <p className="text-sm font-semibold text-foreground">
              {t.common.add_to_home_title}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.common.add_to_home_steps}
            </p>
            <Button
              className="mt-3 w-full h-10 rounded-xl font-bold"
              onClick={() => setShowAddToHomeHelp(false)}
            >
              OK
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

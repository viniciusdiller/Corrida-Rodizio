"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pizza, Fish, Beef, Beer, Settings } from "lucide-react";
import type { FoodType, Race } from "@/types/database";
import { generateRoomCode } from "@/lib/utils/room-code";
import { getParticipantStorageKey } from "@/lib/utils/participant-storage";
import { DEFAULT_AVATAR } from "@/lib/utils/avatars";
import { useLanguage } from "@/contexts/language-context";
import { isAlphanumericOnly } from "@/lib/utils/username-validation";

// Componentes refatorados
import { HomeHeader } from "@/components/home/home-header";
import { AccountSection } from "@/components/home/account-section";
import { CreateRaceForm } from "@/components/home/create-race-form";
import { JoinRaceForm } from "@/components/home/join-race-form";
import { StartActions } from "@/components/home/start-actions";
import { toast } from "sonner";

const LOGIN_STORAGE_KEY = "rodizio-race-login";

export default function Home() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const uiText = {
    create_account_success: {
      pt: "Conta criada com sucesso!",
      en: "Account created successfully!",
      es: "Cuenta creada con éxito!",
      fr: "Compte créé avec succès !",
    },
    login_error: {
      pt: "Erro ao entrar. Tente novamente.",
      en: "Unable to log in. Please try again.",
      es: "Error al iniciar sesión. Inténtalo de nuevo.",
      fr: "Erreur de connexion. Réessayez.",
    },
    claim_enter_code: {
      pt: "Digite o codigo.",
      en: "Enter the code.",
      es: "Ingresa el código.",
      fr: "Entrez le code.",
    },
    claim_register_error: {
      pt: "Erro ao registrar.",
      en: "Registration error.",
      es: "Error al registrar.",
      fr: "Erreur lors de l'enregistrement.",
    },
    claim_register_unavailable: {
      pt: "Nao foi possivel registrar o avatar.",
      en: "Unable to register the avatar.",
      es: "No fue posible registrar el avatar.",
      fr: "Impossible d'enregistrer l'avatar.",
    },
    fill_all_fields: {
      pt: "Preencha todos os campos.",
      en: "Fill in all fields.",
      es: "Completa todos los campos.",
      fr: "Remplissez tous les champs.",
    },
    current_password_incorrect: {
      pt: "Senha atual incorreta.",
      en: "Current password is incorrect.",
      es: "La contraseña actual es incorrecta.",
      fr: "Le mot de passe actuel est incorrect.",
    },
    password_updated: {
      pt: "Senha trocada com sucesso.",
      en: "Password updated successfully.",
      es: "Contraseña actualizada con éxito.",
      fr: "Mot de passe mis à jour avec succès.",
    },
    password_update_unavailable: {
      pt: "Nao foi possivel atualizar a senha.",
      en: "Unable to update the password.",
      es: "No fue posible actualizar la contraseña.",
      fr: "Impossible de mettre à jour le mot de passe.",
    },
    login_required_photo: {
      pt: "Você precisa estar logado para o modo foto.",
      en: "You must be logged in to use photo mode.",
      es: "Debes iniciar sesión para usar el modo foto.",
      fr: "Vous devez être connecté pour utiliser le mode photo.",
    },
    create_room_error: {
      pt: "Erro ao criar sala.",
      en: "Unable to create room.",
      es: "No se pudo crear la sala.",
      fr: "Impossible de créer la salle.",
    },
    join_room_error: {
      pt: "Erro ao entrar na sala.",
      en: "Unable to join the room.",
      es: "Error al entrar a la sala.",
      fr: "Impossible de rejoindre la salle.",
    },
  } as const;
  const tx = <K extends keyof typeof uiText>(key: K) => uiText[key][language];

  // ESTADOS PRINCIPAIS
  const [playerName, setPlayerName] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodType | null>(null);
  const [flow, setFlow] = useState<"create" | "join" | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [photoMode, setPhotoMode] = useState<"optional" | "mandatory">(
    "optional",
  );
  const [hasEditedName, setHasEditedName] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [defaultAvatar, setDefaultAvatar] = useState<string | null>(
    DEFAULT_AVATAR,
  );

  // ESTADOS DE CONTA
  const [accountFlow, setAccountFlow] = useState<"login" | "create" | null>(
    null,
  );
  const [accountCodeInput, setAccountCodeInput] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountConfirmPassword, setAccountConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [loginCode, setLoginCode] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [myGroups, setMyGroups] = useState<Race[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [roomsWithPhotos, setRoomsWithPhotos] = useState<string[]>([]);
  const photoModeEnabled = !!loginCode;
  const photoRequired = photoMode === "mandatory";

  const [showHistory, setShowHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [showAccountOverlay, setShowAccountOverlay] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showAddToHomeHelp, setShowAddToHomeHelp] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimCode, setClaimCode] = useState("");
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [promoPermissions, setPromoPermissions] = useState<string[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  const notifyLoginUpdated = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("rodizio-login-updated"));
    }
  };

  const formatAccountLabel = (value: string) =>
    value.length > 16 ? `${value.slice(0, 16)}...` : value;

  const toggleHistory = () => {
    if (!showHistory && myGroups.length === 0) {
      handleLoadGroups();
    }
    setShowHistory(!showHistory);
    setCurrentPage(1);
  };

  const foodTypeOptions: Record<
    string,
    { type: FoodType; label: string; icon: typeof Pizza }[]
  > = {
    pt: [
      { type: "pizza", label: "Pizza", icon: Pizza },
      { type: "sushi", label: "Japa", icon: Fish },
      { type: "burger", label: "Burger", icon: Beef },
      { type: "drinks", label: "Bebida", icon: Beer },
    ],
    en: [
      { type: "pizza", label: "Pizza", icon: Pizza },
      { type: "sushi", label: "Sushi", icon: Fish },
      { type: "burger", label: "Burger", icon: Beef },
      { type: "drinks", label: "Drinks", icon: Beer },
    ],
    es: [
      { type: "pizza", label: "Pizza", icon: Pizza },
      { type: "sushi", label: "Sushi", icon: Fish },
      { type: "burger", label: "Burger", icon: Beef },
      { type: "drinks", label: "Bebidas", icon: Beer },
    ],
    fr: [
      { type: "pizza", label: "Pizza", icon: Pizza },
      { type: "sushi", label: "Sushi", icon: Fish },
      { type: "burger", label: "Burger", icon: Beef },
      { type: "drinks", label: "Boissons", icon: Beer },
    ],
  };

  const foodTypes = foodTypeOptions[language] ?? foodTypeOptions.pt;

  useEffect(() => {
    const storedLogin = localStorage.getItem(LOGIN_STORAGE_KEY);
    if (storedLogin) setLoginCode(storedLogin);
  }, []);

  useEffect(() => {
    const loadTermsAcceptance = async () => {
      if (!loginCode) {
        setHasAcceptedTerms(false);
        return;
      }
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("player_profiles")
          .select("terms_accepted_at, terms_version")
          .eq("login_code", loginCode.trim().toUpperCase())
          .maybeSingle();
        const accepted =
          !!data?.terms_accepted_at && data?.terms_version === "v1";
        setHasAcceptedTerms(accepted);
      } catch {
        setHasAcceptedTerms(false);
      }
    };

    loadTermsAcceptance();
  }, [loginCode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const standaloneMatch = window.matchMedia?.("(display-mode: standalone)");
    const standalone =
      (window.navigator as any).standalone === true ||
      (standaloneMatch?.matches ?? false);
    setIsIosDevice(isIos);
    setIsStandalone(standalone);
  }, []);

  const loadPromoPermissions = async () => {
    if (!loginCode) {
      setPromoPermissions([]);
      return;
    }
    setIsLoadingPermissions(true);
    try {
      const response = await fetch(
        `/api/promo-codes/permissions?loginCode=${encodeURIComponent(
          loginCode.trim().toUpperCase(),
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

  useEffect(() => {
    loadPromoPermissions();
  }, [loginCode]);

  useEffect(() => {
    let isMounted = true;
    const loadDefaultAvatar = async () => {
      if (DEFAULT_AVATAR) return;
      try {
        const response = await fetch("/api/avatars");
        if (!response.ok) return;
        const data = await response.json();
        const list = Array.isArray(data?.avatars) ? data.avatars : [];
        if (isMounted && list.length > 0) {
          setDefaultAvatar(list[0]);
        }
      } catch {
        return;
      }
    };

    loadDefaultAvatar();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (
      loginCode &&
      (flow === "create" || flow === "join") &&
      !playerName.trim() &&
      !hasEditedName
    ) {
      setPlayerName(loginCode);
    }
  }, [loginCode, flow, playerName, hasEditedName]);

  useEffect(() => {
    if (flow === null) {
      setHasEditedName(false);
      setIsSpectator(false);
      setPhotoMode("optional");
    }
  }, [flow]);

  const handlePlayerNameChange = (value: string) => {
    setHasEditedName(true);
    setPlayerName(value);
  };

  // --- FUNÇÕES DE SUPORTE ---

  const isMissingColumn = (error: unknown, column: string) => {
    if (!error || typeof error !== "object") return false;
    const maybeError = error as any;
    const haystack = [
      maybeError.message,
      maybeError.details,
      maybeError.hint,
    ].filter(Boolean);
    return (
      maybeError.code === "42703" ||
      haystack.some((text: string) => text?.includes(column))
    );
  };

  const insertParticipantWithFallback = async (supabase: any, payload: any) => {
    let { data, error } = await supabase
      .from("participants")
      .insert(payload)
      .select()
      .single();

    if (
      error &&
      (isMissingColumn(error, "team") ||
        isMissingColumn(error, "avatar") ||
        isMissingColumn(error, "is_vip") ||
        isMissingColumn(error, "login_code"))
    ) {
      const fallbackPayload: any = {
        race_id: payload.race_id,
        name: payload.name,
        items_eaten: payload.items_eaten,
      };
      if (!isMissingColumn(error, "team")) fallbackPayload.team = payload.team;
      if (!isMissingColumn(error, "avatar"))
        fallbackPayload.avatar = payload.avatar;
      if (!isMissingColumn(error, "is_vip"))
        fallbackPayload.is_vip = payload.is_vip;
      if (!isMissingColumn(error, "login_code"))
        fallbackPayload.login_code = payload.login_code;

      const fallback = await supabase
        .from("participants")
        .insert(fallbackPayload)
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }
    return { data, error };
  };

  const getLastUsedAvatar = async (
    supabase: any,
    login: string | null,
    name: string,
  ) => {
    try {
      let query = supabase
        .from("participants")
        .select("avatar")
        .not("avatar", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);

      if (login) {
        query = query.eq("login_code", login);
      } else {
        query = query.eq("name", name);
      }

      const { data } = await query.maybeSingle();
      return data?.avatar ?? defaultAvatar;
    } catch {
      return defaultAvatar;
    }
  };

  // --- LÓGICA DE CONTA ---

  const handleCreateLogin = async () => {
    if (!accountPassword.trim() || !accountCodeInput.trim()) return;
    if (accountPassword.trim().length < 6) {
      toast.error(t.account.password_too_short);
      return;
    }
    if (accountPassword !== accountConfirmPassword) {
      toast.error(t.account.passwords_do_not_match);
      return;
    }
    if (!acceptTerms) {
      toast.error(t.account.accept_terms_required);
      return;
    }
    setAccountLoading(true);
    setGroupsError(null);
    try {
      const supabase = createClient();
      const normalizedName = accountCodeInput.trim().toUpperCase();
      if (!isAlphanumericOnly(normalizedName)) {
        toast.error(t.account.username_format_invalid);
        return;
      }

      const { data, error } = await supabase.rpc("create_login", {
        p_username: normalizedName,
        p_password: accountPassword,
      });

      if (error) throw error;

      await supabase.from("player_profiles").upsert({
        login_code: data,
        terms_accepted_at: new Date().toISOString(),
        terms_version: "v1",
      });
      setHasAcceptedTerms(true);

      setLoginCode(data);
      localStorage.setItem(LOGIN_STORAGE_KEY, data);
      notifyLoginUpdated();
      setAccountFlow(null);
      setAccountPassword("");
      setAccountConfirmPassword("");
      setAccountCodeInput("");
      setAcceptTerms(false);
      toast.success(tx("create_account_success"));
    } catch (error: any) {
      toast.error(
        `Erro ao criar conta: ${error.message || "Tente outro nome"}`,
      );
    } finally {
      setAccountLoading(false);
    }
  };

  const handleRaceTermsAccepted = async (accepted: boolean) => {
    if (!accepted) return;
    if (!loginCode) return;
    try {
      const supabase = createClient();
      await supabase.from("player_profiles").upsert({
        login_code: loginCode.trim().toUpperCase(),
        terms_accepted_at: new Date().toISOString(),
        terms_version: "v1",
      });
      setHasAcceptedTerms(true);
    } catch {
      return;
    }
  };

  const handleLogin = async () => {
    if (!accountCodeInput.trim() || !accountPassword.trim()) return;
    setAccountLoading(true);
    try {
      const supabase = createClient();
      const normalizedName = accountCodeInput.trim().toUpperCase();
      if (!isAlphanumericOnly(normalizedName)) {
        toast.error(t.account.username_format_invalid);
        return;
      }

      const { data, error } = await supabase.rpc("verify_login", {
        p_username: normalizedName, // Nome do parâmetro corrigido para o banco
        p_password: accountPassword,
      });

      if (error || !data) {
        toast.error(t.account.invalid_credentials);
        return;
      }

      setLoginCode(normalizedName);
      localStorage.setItem(LOGIN_STORAGE_KEY, normalizedName);
      notifyLoginUpdated();
      setAccountFlow(null);
      setAccountPassword("");
      setAccountCodeInput("");

      handleLoadGroups(normalizedName);
    } catch (error: any) {
      toast.error(tx("login_error"));
    } finally {
      setAccountLoading(false);
    }
  };

  const handleLoadGroups = async (usernameOverride?: string) => {
    const codeToUse = usernameOverride || loginCode;
    if (!codeToUse) return;

    setIsLoadingGroups(true);
    setGroupsError(null);

    try {
      const supabase = createClient();

      // Buscamos os participantes vinculados ao seu login_code
      const { data, error } = await supabase
        .from("participants")
        .select(
          `
        items_eaten,
        races (
          id,
          name,
          room_code,
          food_type,
          is_active,
          created_at,
          photo_mode
        )
      `,
        )
        .eq("login_code", codeToUse);

      if (error) throw error;

      // --- LÓGICA DE DEDUPLICAÇÃO ---
      // Usamos um Map para agrupar as participações pelo ID da Sala (races.id)
      const historyMap = new Map();

      data?.forEach((item: any) => {
        const race = item.races;
        // Garante que pegamos o objeto da sala, tratando se vier como array ou objeto
        const raceData = Array.isArray(race) ? race[0] : race;

        if (raceData && raceData.id) {
          // Se a sala ainda não está no mapa OU se este registro novo tem mais itens comidos
          if (
            !historyMap.has(raceData.id) ||
            item.items_eaten > historyMap.get(raceData.id).items_eaten
          ) {
            historyMap.set(raceData.id, {
              ...raceData,
              items_eaten: item.items_eaten,
            });
          }
        }
      });

      // Converte o Mapa de volta para Array e ordena pela data de criação (mais recentes primeiro)
      const history = Array.from(historyMap.values()).sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      setMyGroups(history);

      const photoModeRooms = history
        .filter((group: any) => group.photo_mode)
        .map((group: any) => group.room_code)
        .filter(Boolean);
      if (photoModeRooms.length === 0) {
        setRoomsWithPhotos([]);
      } else {
        const query = encodeURIComponent(photoModeRooms.join(","));
        const availability = await fetch(
          `/api/race-photos/availability?roomCodes=${query}&loginCode=${encodeURIComponent(
            codeToUse,
          )}`,
        )
          .then((res) => res.json())
          .catch(() => ({ rooms: [] }));
        const rooms = Array.isArray(availability?.rooms)
          ? availability.rooms
          : [];
        setRoomsWithPhotos(rooms);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      setGroupsError("Não foi possível carregar seu histórico.");
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleLogout = () => {
    setLoginCode(null);
    setMyGroups([]);
    localStorage.removeItem(LOGIN_STORAGE_KEY);
    setShowAccountOverlay(false);
    setShowPasswordForm(false);
    setPasswordStatus(null);
    setShowPasswordSuccess(false);
    setHasAcceptedTerms(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
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

  const handleClaimExclusiveAvatar = async () => {
    if (!loginCode) return;
    const trimmedCode = claimCode.trim();
    if (!trimmedCode) {
      setClaimStatus(tx("claim_enter_code"));
      return;
    }
    setIsClaiming(true);
    setClaimStatus(null);
    try {
      const response = await fetch("/api/exclusive-avatars/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginCode: loginCode.trim().toUpperCase(),
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
      setClaimStatus(tx("claim_register_error"));
    } catch {
      setClaimStatus(tx("claim_register_unavailable"));
    } finally {
      setIsClaiming(false);
    }
  };

  const handleChangePassword = async () => {
    if (!loginCode) return;
    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmNewPassword.trim();
    if (!trimmedCurrent || !trimmedNew || !trimmedConfirm) {
      setPasswordStatus(tx("fill_all_fields"));
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setPasswordStatus(t.account.passwords_do_not_match);
      return;
    }
    if (trimmedNew.length < 6) {
      setPasswordStatus(t.account.password_too_short);
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordStatus(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("change_login_password", {
        p_username: loginCode.trim().toUpperCase(),
        p_old_password: trimmedCurrent,
        p_new_password: trimmedNew,
      });

      if (error) {
        setPasswordStatus(error.message || tx("current_password_incorrect"));
        return;
      }
      if (data === false) {
        setPasswordStatus(tx("current_password_incorrect"));
        return;
      }

      setPasswordStatus(tx("password_updated"));
      setShowPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setShowPasswordForm(false);
    } catch {
      setPasswordStatus(tx("password_update_unavailable"));
    } finally {
      setIsUpdatingPassword(false);
    }
  };
  // --- LÓGICA DAS SALAS ---

  const handleCreateRoom = async () => {
    const normalizedName = playerName.trim();
    const roomOwnerName = loginCode?.trim() || normalizedName;
    if (!normalizedName || !roomOwnerName || !selectedFood) return;
    if (photoModeEnabled && !loginCode) {
      toast.error(tx("login_required_photo"));
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const code = generateRoomCode();

      let { data: race, error: raceError } = await supabase
        .from("races")
        .insert({
          name: `Sala de ${roomOwnerName}`,
          food_type: selectedFood,
          room_code: code,
          is_active: true,
          is_team_mode: isTeamMode,
          photo_mode: !!photoModeEnabled && !!loginCode,
          photo_required: !!photoRequired && !!loginCode,
        })
        .select()
        .single();

      if (
        raceError &&
        (isMissingColumn(raceError, "is_team_mode") ||
          isMissingColumn(raceError, "photo_mode") ||
          isMissingColumn(raceError, "photo_required"))
      ) {
        const fallback = await supabase
          .from("races")
          .insert({
            name: `Sala de ${roomOwnerName}`,
            food_type: selectedFood,
            room_code: code,
            is_active: true,
          })
          .select()
          .single();
        race = fallback.data;
        raceError = fallback.error;
      }
      if (raceError) throw raceError;

      const avatarToUse = await getLastUsedAvatar(
        supabase,
        loginCode,
        normalizedName,
      );
      const { data: participant } = await insertParticipantWithFallback(
        supabase,
        {
          race_id: race.id,
          name: normalizedName,
          items_eaten: 0,
          avatar: avatarToUse,
          is_vip: true,
          login_code: loginCode,
        },
      );
      if (participant)
        localStorage.setItem(getParticipantStorageKey(code), participant.id);
      router.push(`/sala/${code}`);
    } catch (e) {
      toast.error(tx("create_room_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    const normalizedName = playerName.trim();
    if (!isSpectator && !normalizedName) return;
    if (!roomCode.trim()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const normalized = roomCode.toUpperCase();
      const normalizedLoginCode = loginCode?.trim().toUpperCase() ?? null;

      // 1. Verificar se a sala existe e está ativa
      const { data: race, error: raceError } = await supabase
        .from("races")
        .select()
        .eq("room_code", normalized)
        .eq("is_active", true)
        .single();

      if (raceError || !race) throw new Error("Sala não encontrada");

      if (isSpectator) {
        router.push(`/sala/${normalized}?spectator=1`);
        return;
      }

      // 2. Tentar encontrar um participante existente com este nome nesta sala
      const { data: existingParticipant } = await supabase
        .from("participants")
        .select("id, login_code")
        .eq("race_id", race.id)
        .ilike("name", normalizedName)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingParticipant) {
        const existingLoginCode = existingParticipant.login_code?.toUpperCase();
        const hasExistingAccount = !!existingLoginCode;
        const hasCurrentAccount = !!normalizedLoginCode;
        const isSameAccount =
          hasExistingAccount &&
          hasCurrentAccount &&
          existingLoginCode === normalizedLoginCode;

        if (
          (hasExistingAccount && !isSameAccount) ||
          (hasCurrentAccount && !hasExistingAccount)
        ) {
          toast.error(
            t.room?.codename_taken ??
              "Outro jogador já está usando esse codinome.",
          );
          return;
        }

        // Se encontrar, re-associa o usuário ao registro antigo (mantém o status VIP se houver)
        localStorage.setItem(
          getParticipantStorageKey(normalized),
          existingParticipant.id,
        );
        router.push(`/sala/${normalized}`);
        return;
      }

      // 3. Se não encontrar, cria um novo participante
      const avatarToUse = await getLastUsedAvatar(
        supabase,
        loginCode,
        normalizedName,
      );
      const { data: participant, error: pError } =
        await insertParticipantWithFallback(supabase, {
          race_id: race.id,
          name: normalizedName,
          items_eaten: 0,
          team: null,
          avatar: avatarToUse,
          is_vip: false,
          login_code: loginCode,
        });

      if (pError) throw pError;
      if (participant)
        localStorage.setItem(
          getParticipantStorageKey(normalized),
          participant.id,
        );

      router.push(`/sala/${normalized}`);
    } catch (e: any) {
      toast.error(e.message ?? tx("join_room_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-orange-100/50 via-background to-background dark:from-purple-950/50 dark:via-black dark:to-black px-6 pb-4 pt-0 md:px-12 md:pb-12 md:pt-8 transition-colors duration-500">
      {loginCode && showAccountOverlay && (
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
      <div className="mx-auto max-w-xl space-y-6">
        <div className="space-y-3">
          <HomeHeader
            isCompact={flow !== null || accountFlow !== null}
            accountPill={
              loginCode ? (
                <button
                  type="button"
                  onClick={toggleAccountOverlay}
                  className="inline-flex items-center rounded-xl border border-muted/60 bg-background/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur transition hover:border-primary/40 hover:text-primary whitespace-nowrap"
                >
                  <Settings className="mr-2 h-3.5 w-3.5" />
                  {formatAccountLabel(loginCode)}
                </button>
              ) : null
            }
          />

          <Card className="border-none shadow-2xl shadow-black/5 bg-card/80 backdrop-blur-md">
            <CardContent className="pt-0 space-y-6">
              {!flow && (
                <AccountSection
                  loginCode={loginCode}
                  accountFlow={accountFlow}
                  accountLoading={accountLoading}
                  accountCodeInput={accountCodeInput}
                  accountPassword={accountPassword}
                  accountConfirmPassword={accountConfirmPassword}
                  acceptTerms={acceptTerms}
                  setAcceptTerms={setAcceptTerms}
                  myGroups={myGroups}
                  isLoadingGroups={isLoadingGroups}
                  groupsError={groupsError}
                  showHistory={showHistory}
                  onToggleHistory={toggleHistory}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onLoadGroups={handleLoadGroups}
                  onLogin={handleLogin}
                  onCreateLogin={handleCreateLogin}
                  setAccountFlow={setAccountFlow}
                  setAccountCodeInput={setAccountCodeInput}
                  setAccountPassword={setAccountPassword}
                  setAccountConfirmPassword={setAccountConfirmPassword}
                  onMenuStateChange={setIsAccountMenuOpen}
                  router={router}
                  roomsWithPhotos={roomsWithPhotos}
                />
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

              {!isAccountMenuOpen &&
                (!flow ? (
                  <StartActions onSetFlow={setFlow} />
                ) : flow === "create" ? (
                  <CreateRaceForm
                    playerName={playerName}
                    setPlayerName={handlePlayerNameChange}
                    isTeamMode={isTeamMode}
                    setIsTeamMode={setIsTeamMode}
                    photoMode={photoMode}
                    setPhotoMode={setPhotoMode}
                    canEnablePhotoMode={!!loginCode}
                    requireTerms={
                      !loginCode || !hasAcceptedTerms || photoModeEnabled
                    }
                    onTermsAccepted={handleRaceTermsAccepted}
                    selectedFood={selectedFood}
                    setSelectedFood={setSelectedFood}
                    foodTypes={foodTypes}
                    loading={loading}
                    onCreate={handleCreateRoom}
                    onBack={() => {
                      setFlow(null);
                      setSelectedFood(null);
                    }}
                  />
                ) : (
                  <JoinRaceForm
                    playerName={playerName}
                    setPlayerName={handlePlayerNameChange}
                    roomCode={roomCode}
                    setRoomCode={setRoomCode}
                    loading={loading}
                    isSpectator={isSpectator}
                    setIsSpectator={setIsSpectator}
                    onJoin={handleJoinRoom}
                    onBack={() => {
                      setFlow(null);
                      setRoomCode("");
                    }}
                  />
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
      <footer className="mt-8 mb-4 text-center text-[10px] text-muted-foreground/60 uppercase font-medium tracking-widest">
        <p>
          {t.footer.copyright.replace(
            "{{year}}",
            new Date().getFullYear().toString(),
          )}
        </p>
      </footer>
    </div>
  );
}

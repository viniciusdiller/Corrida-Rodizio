"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pizza, Fish, Beef, Beer, Settings } from "lucide-react";
import type { FoodType, Race } from "@/types/database";
import { generateRoomCode } from "@/lib/utils/room-code";
import { getParticipantStorageKey } from "@/lib/utils/participant-storage";
import { DEFAULT_AVATAR } from "@/lib/utils/avatars";
import { useLanguage } from "@/contexts/language-context";
import { isAlphanumericOnly } from "@/lib/utils/username-validation";
import { AccountMenuOverlay } from "@/components/account/account-menu-overlay";

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
    claim_registered_success: {
      pt: "Avatar registrado com sucesso.",
      en: "Avatar registered successfully.",
      es: "Avatar registrado con exito.",
      fr: "Avatar enregistre avec succes.",
    },
    claim_prompt_label: {
      pt: "Codigo de resgate",
      en: "Claim code",
      es: "Codigo de canje",
      fr: "Code de redemption",
    },
    claim_prompt_placeholder: {
      pt: "EX: BETA-2025-01",
      en: "E.g. BETA-2025-01",
      es: "Ej: BETA-2025-01",
      fr: "Ex: BETA-2025-01",
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
    recovery_email_reminder: {
      pt: "Adicione um e-mail de recuperação para sua segurança. Clique na engrenagem para configurar.",
      en: "Add a recovery email for your safety. Click the gear to set it up.",
      es: "Agrega un correo de recuperación para tu seguridad. Haz clic en el engranaje para configurarlo.",
      fr: "Ajoutez un e-mail de récupération pour votre sécurité. Cliquez sur l'engrenage pour le configurer.",
    },
    recovery_email_save_error: {
      pt: "Não foi possível salvar o e-mail.",
      en: "Could not save the email.",
      es: "No se pudo guardar el correo.",
      fr: "Impossible d'enregistrer l'e-mail.",
    },
    recovery_email_saved: {
      pt: "E-mail de recuperação salvo.",
      en: "Recovery email saved.",
      es: "Correo de recuperación guardado.",
      fr: "E-mail de récupération enregistré.",
    },
    reset_username_email_mismatch: {
      pt: "Usuário e e-mail não conferem.",
      en: "Username and email do not match.",
      es: "El usuario y el correo no coinciden.",
      fr: "Le nom d'utilisateur et l'e-mail ne correspondent pas.",
    },
    reset_request_start_error: {
      pt: "Não foi possível iniciar a recuperação agora.",
      en: "Could not start recovery right now.",
      es: "No se pudo iniciar la recuperación ahora.",
      fr: "Impossible de démarrer la récupération pour le moment.",
    },
    reset_request_sent: {
      pt: "Se existir uma conta com esse usuário e e-mail, enviamos um código.",
      en: "If an account exists with that username and email, we sent a code.",
      es: "Si existe una cuenta con ese usuario y correo, enviamos un código.",
      fr: "Si un compte existe avec ce nom d'utilisateur et cet e-mail, nous avons envoyé un code.",
    },
    recovery_email_label: {
      pt: "E-mail de recuperação",
      en: "Recovery email",
      es: "Correo de recuperación",
      fr: "E-mail de récupération",
    },
    recovery_email_placeholder: {
      pt: "voce@email.com",
      en: "you@email.com",
      es: "tu@email.com",
      fr: "vous@email.com",
    },
    update_btn: {
      pt: "Atualizar",
      en: "Update",
      es: "Actualizar",
      fr: "Mettre à jour",
    },
    save_btn: {
      pt: "Salvar",
      en: "Save",
      es: "Guardar",
      fr: "Enregistrer",
    },
    premium_credits_available: {
      pt: "Créditos premium disponíveis: {count}",
      en: "Premium credits available: {count}",
      es: "Créditos premium disponibles: {count}",
      fr: "Crédits premium disponibles : {count}",
    },
    referral_applied_success: {
      pt: "Código de indicação aplicado! Ambos receberam +1 crédito premium.",
      en: "Referral code applied! Both accounts received +1 premium credit.",
      es: "¡Código de referencia aplicado! Ambas cuentas recibieron +1 crédito premium.",
      fr: "Code de parrainage appliqué ! Les deux comptes ont reçu +1 crédit premium.",
    },
    referral_applied_error: {
      pt: "Não foi possível aplicar o código de indicação.",
      en: "Could not apply the referral code.",
      es: "No se pudo aplicar el código de referencia.",
      fr: "Impossible d'appliquer le code de parrainage.",
    },
    invitation_code_label: {
      pt: "Código de convite",
      en: "Invitation code",
      es: "Código de invitación",
      fr: "Code d'invitation",
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
  const [accountFlow, setAccountFlow] = useState<"login" | "create" | "reset" | null>(
    null,
  );
  const [accountCodeInput, setAccountCodeInput] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountConfirmPassword, setAccountConfirmPassword] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountReferralCode, setAccountReferralCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [loginCode, setLoginCode] = useState<string | null>(null);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetStatus, setPasswordResetStatus] = useState<string | null>(null);
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
  const [recoveryEmailInput, setRecoveryEmailInput] = useState("");
  const [savedRecoveryEmail, setSavedRecoveryEmail] = useState<string | null>(null);
  const [recoveryEmailState, setRecoveryEmailState] = useState<"unknown" | "present" | "missing" | "error">("unknown");
  const [isSavingRecoveryEmail, setIsSavingRecoveryEmail] = useState(false);
  const [recoveryEmailStatus, setRecoveryEmailStatus] = useState<string | null>(null);
  const [promoPermissions, setPromoPermissions] = useState<string[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [availablePremiumCredits, setAvailablePremiumCredits] = useState<number | null>(null);
  const recoveryReminderShownForLoginRef = useRef<string | null>(null);

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
    if (storedLogin) {
      setLoginCode(storedLogin);
      setInvitationCode(storedLogin);
    }
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

  const loadAvailablePremiumCredits = async () => {
    if (!loginCode) {
      setAvailablePremiumCredits(null);
      return;
    }
    try {
      const response = await fetch(
        `/api/premium-avatars/welcome-status?loginCode=${encodeURIComponent(
          loginCode.trim().toUpperCase(),
        )}`,
      );
      const data = await response.json().catch(() => ({}));
      const claimCredits = Number(data?.claimCredits);
      const claimedCount = Number(data?.claimedCount);
      if (Number.isFinite(claimCredits) && Number.isFinite(claimedCount)) {
        setAvailablePremiumCredits(Math.max(0, Math.floor(claimCredits - claimedCount)));
        return;
      }
      setAvailablePremiumCredits(0);
    } catch {
      setAvailablePremiumCredits(0);
    }
  };

  useEffect(() => {
    loadAvailablePremiumCredits();
  }, [loginCode]);

  useEffect(() => {
    const loadInvitationCode = async () => {
      if (!loginCode) {
        setInvitationCode(null);
        return;
      }

      const normalized = loginCode.trim().toUpperCase();
      try {
        const response = await fetch(
          `/api/account/referral-code?loginCode=${encodeURIComponent(normalized)}`
        );
        const data = await response.json().catch(() => ({}));
        const referralCode = typeof data?.referralCode === "string" ? data.referralCode : null;
        setInvitationCode(referralCode ?? normalized);
      } catch {
        setInvitationCode(normalized);
      }
    };

    loadInvitationCode();
  }, [loginCode]);

  useEffect(() => {
    const loadRecoveryEmail = async () => {
      if (!loginCode) {
        setSavedRecoveryEmail(null);
        setRecoveryEmailInput("");
        setRecoveryEmailState("unknown");
        return;
      }

      setRecoveryEmailState("unknown");
      try {
        const response = await fetch(
          `/api/account/recovery-email?loginCode=${encodeURIComponent(loginCode.trim().toUpperCase())}`,
        );
        const data = await response.json().catch(() => ({}));
        const email = typeof data?.email === "string" ? data.email : null;
        setSavedRecoveryEmail(email);
        if (email) {
          setRecoveryEmailInput(email);
          setRecoveryEmailState("present");
        } else {
          setRecoveryEmailState("missing");
        }
      } catch {
        setSavedRecoveryEmail(null);
        setRecoveryEmailState("error");
      }
    };

    loadRecoveryEmail();
  }, [loginCode]);

  useEffect(() => {
    if (!loginCode || recoveryEmailState !== "missing") return;
    if (recoveryReminderShownForLoginRef.current === loginCode) return;

    toast.info(tx("recovery_email_reminder"), {
      position: "top-center",
      duration: 7000,
    });
    recoveryReminderShownForLoginRef.current = loginCode;
  }, [loginCode, recoveryEmailState]);

  const handleSaveRecoveryEmail = async () => {
    if (!loginCode || !recoveryEmailInput.trim()) {
      setRecoveryEmailStatus(tx("fill_all_fields"));
      return;
    }
    setIsSavingRecoveryEmail(true);
    setRecoveryEmailStatus(null);
    try {
      const response = await fetch("/api/account/recovery-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginCode: loginCode.trim().toUpperCase(),
          email: recoveryEmailInput.trim().toLowerCase(),
        }),
      });
      if (!response.ok) {
        setRecoveryEmailStatus(tx("recovery_email_save_error"));
        return;
      }
      setSavedRecoveryEmail(recoveryEmailInput.trim().toLowerCase());
      setRecoveryEmailState("present");
      setRecoveryEmailStatus(tx("recovery_email_saved"));
    } catch {
      setRecoveryEmailStatus(tx("recovery_email_save_error"));
    } finally {
      setIsSavingRecoveryEmail(false);
    }
  };


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
        p_preferred_language: language,
      });

      if (error) throw error;

      const profilePayload = {
        login_code: data,
        terms_accepted_at: new Date().toISOString(),
        terms_version: "v1",
        premium_avatar_claim_credits: 1,
      };
      let { error: profileError } = await supabase
        .from("player_profiles")
        .upsert(profilePayload);

      if (profileError && isMissingColumn(profileError, "premium_avatar_claim_credits")) {
        const fallback = await supabase.from("player_profiles").upsert({
          login_code: data,
          terms_accepted_at: profilePayload.terms_accepted_at,
          terms_version: "v1",
        });
        profileError = fallback.error;
      }

      if (profileError) throw profileError;

      if (accountEmail.trim()) {
        const normalizedEmail = accountEmail.trim().toLowerCase();
        const { data: savedRecoveryEmail } = await supabase.rpc("set_login_recovery_email", {
          p_username: data,
          p_email: normalizedEmail,
        });

        if (savedRecoveryEmail) {
          await fetch("/api/account/welcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: data, email: normalizedEmail, language }),
          }).catch(() => null);
        }

        if (savedRecoveryEmail && accountReferralCode.trim()) {
          const { data: referralApplied, error: referralError } = await supabase.rpc(
            "apply_login_referral",
            {
              p_referred_login_code: data,
              p_referral_code: accountReferralCode.trim().toUpperCase(),
            },
          );

          if (referralError || !referralApplied) {
            toast.error(tx("referral_applied_error"));
          } else {
            toast.success(tx("referral_applied_success"));
          }
        }
      }

      setHasAcceptedTerms(true);

      setLoginCode(data);
      recoveryReminderShownForLoginRef.current = null;
      setRecoveryEmailState("unknown");
      localStorage.setItem(LOGIN_STORAGE_KEY, data);
      notifyLoginUpdated();
      setAccountFlow(null);
      setAccountPassword("");
      setAccountConfirmPassword("");
      setAccountCodeInput("");
      setAccountEmail("");
      setAccountReferralCode("");
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
      recoveryReminderShownForLoginRef.current = null;
      setRecoveryEmailState("unknown");
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


  const handleRequestPasswordReset = async (username: string, email: string) => {
    const normalizedName = username.trim().toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedName || !normalizedEmail) {
      setPasswordResetStatus(tx("fill_all_fields"));
      return;
    }

    setPasswordResetLoading(true);
    setPasswordResetStatus(null);
    try {
      const response = await fetch("/api/account/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalizedName, email: normalizedEmail }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.reason === "username_email_mismatch") {
          toast.error(tx("reset_username_email_mismatch"), { position: "bottom-center" });
          setPasswordResetStatus(tx("reset_username_email_mismatch"));
          return;
        }
        setPasswordResetStatus(tx("reset_request_start_error"));
        return;
      }

      setPasswordResetStatus(tx("reset_request_sent"));
    } catch {
      setPasswordResetStatus(tx("reset_request_start_error"));
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const handleConfirmPasswordReset = async (payload: {
    username: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const normalizedName = payload.username.trim().toUpperCase();
    const normalizedCode = payload.code.trim().toUpperCase();
    if (!normalizedName || !normalizedCode || !payload.newPassword.trim() || !payload.confirmPassword.trim()) {
      setPasswordResetStatus(tx("fill_all_fields"));
      return;
    }
    if (payload.newPassword.trim() !== payload.confirmPassword.trim()) {
      setPasswordResetStatus(t.account.passwords_do_not_match);
      return;
    }
    if (payload.newPassword.trim().length < 6) {
      setPasswordResetStatus(t.account.password_too_short);
      return;
    }

    setPasswordResetLoading(true);
    setPasswordResetStatus(null);
    try {
      const response = await fetch("/api/account/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: normalizedName,
          code: normalizedCode,
          newPassword: payload.newPassword,
        }),
      });
      if (!response.ok) {
        setPasswordResetStatus("Código inválido ou expirado.");
        return;
      }
      setPasswordResetStatus("Senha redefinida com sucesso. Faça login.");
      setAccountFlow("login");
      setAccountPassword("");
      setAccountConfirmPassword("");
    } catch {
      setPasswordResetStatus("Não foi possível redefinir a senha agora.");
    } finally {
      setPasswordResetLoading(false);
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
    recoveryReminderShownForLoginRef.current = null;
    setRecoveryEmailState("unknown");
    setSavedRecoveryEmail(null);
    setRecoveryEmailInput("");
    setRecoveryEmailStatus(null);
    setLoginCode(null);
    setInvitationCode(null);
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
    setAvailablePremiumCredits(null);
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
        setRecoveryEmailStatus(null);
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
      if (status === "claimed" || status === "already_claimed") {
        setClaimStatus(tx("claim_registered_success"));
        setClaimCode("");
        return;
      }
      if (status === "invalid") {
        setClaimStatus(tx("claim_register_error"));
        return;
      }
      setClaimStatus(tx("claim_register_unavailable"));
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
        localStorage.setItem(
          getParticipantStorageKey(code, loginCode),
          participant.id,
        );
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
          getParticipantStorageKey(normalized, normalizedLoginCode),
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
          getParticipantStorageKey(normalized, normalizedLoginCode),
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-background to-orange-100 dark:from-black dark:via-zinc-950 dark:to-[#12061a] px-6 pb-4 pt-0 md:px-12 md:pb-12 md:pt-8 transition-colors duration-500">
      {loginCode && (
        <AccountMenuOverlay
          invitationCode={invitationCode}
          open={showAccountOverlay}
          onClose={toggleAccountOverlay}
          labels={{
            addToHome: t.common.add_to_home,
            back: t.common.back,
            changePassword: t.account.change_password,
            claimPromptLabel: tx("claim_prompt_label"),
            claimPromptPlaceholder: tx("claim_prompt_placeholder"),
            claimSubmit: "OK",
            confirmPassword: t.account.confirm_password,
            currentPassword: t.account.current_password,
            loading: t.common.loading,
            logout: t.account.logout,
            manageCodes: t.account.manage_codes,
            newPassword: t.account.new_password,
            premiumCreditsAvailable: tx("premium_credits_available").replace(
              "{count}",
              String(Math.max(0, availablePremiumCredits ?? 0)),
            ),
            invitationCodeLabel: tx("invitation_code_label"),
            recoveryEmailLabel: tx("recovery_email_label"),
            recoveryEmailPlaceholder: tx("recovery_email_placeholder"),
            registerAvatar: t.account.register_avatar,
            save: tx("save_btn"),
            update: tx("update_btn"),
            updatePassword: t.account.update_password,
            updatingPassword: t.account.updating,
          }}
          showPasswordForm={showPasswordForm}
          onTogglePasswordForm={() => {
            setShowPasswordForm((prev) => !prev);
            setPasswordStatus(null);
          }}
          showClaimForm={showClaimForm}
          onToggleClaimForm={() => {
            setShowClaimForm((prev) => !prev);
            setClaimStatus(null);
          }}
          onLogout={handleLogout}
          canManageCodes={!isLoadingPermissions && promoPermissions.length > 0}
          onManageCodes={() => {
            setShowAccountOverlay(false);
            router.push("/codigos-promocionais");
          }}
          showAddToHome={isIosDevice && !isStandalone}
          onAddToHome={() => setShowAddToHomeHelp(true)}
          recoveryEmail={{
            value: recoveryEmailInput,
            onChange: setRecoveryEmailInput,
            onSave: handleSaveRecoveryEmail,
            isSaving: isSavingRecoveryEmail,
            hasSaved: !!savedRecoveryEmail,
            status: recoveryEmailStatus,
          }}
          claim={{
            value: claimCode,
            onChange: setClaimCode,
            onSubmit: handleClaimExclusiveAvatar,
            isSubmitting: isClaiming,
            status: claimStatus,
          }}
          password={{
            current: currentPassword,
            onCurrentChange: setCurrentPassword,
            newPassword,
            onNewChange: setNewPassword,
            confirm: confirmNewPassword,
            onConfirmChange: setConfirmNewPassword,
            onSubmit: handleChangePassword,
            isSubmitting: isUpdatingPassword,
            status: passwordStatus,
          }}
        />
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
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background/90 px-3 text-xs font-bold text-foreground shadow-sm backdrop-blur transition hover:bg-accent/30 whitespace-nowrap"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
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
                  accountEmail={accountEmail}
                  accountReferralCode={accountReferralCode}
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
                  setAccountEmail={setAccountEmail}
                  setAccountReferralCode={setAccountReferralCode}
                  onRequestPasswordReset={handleRequestPasswordReset}
                  onConfirmPasswordReset={handleConfirmPasswordReset}
                  passwordResetLoading={passwordResetLoading}
                  passwordResetStatus={passwordResetStatus}
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
      <footer className="mt-8 mb-4 space-y-3 text-center text-[10px] text-muted-foreground/60 uppercase font-medium tracking-widest">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link
            href="/terms"
            className="transition hover:text-foreground/80"
          >
            {t.footer.terms}
          </Link>
          <Link
            href="/privacy"
            className="transition hover:text-foreground/80"
          >
            {t.footer.privacy}
          </Link>
          <Link
            href="/quem-somos"
            className="transition hover:text-foreground/80"
          >
            {t.footer.about}
          </Link>
        </nav>
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

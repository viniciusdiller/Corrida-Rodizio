"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pizza, Fish, Beef, Settings } from "lucide-react";
import type { FoodType, Race } from "@/types/database";
import { generateRoomCode } from "@/lib/utils/room-code";
import { getParticipantStorageKey } from "@/lib/utils/participant-storage";
import { DEFAULT_AVATAR } from "@/lib/utils/avatars";
import { useLanguage } from "@/contexts/language-context";

// Componentes refatorados
import { HomeHeader } from "@/components/home/home-header";
import { AccountSection } from "@/components/home/account-section";
import { CreateRaceForm } from "@/components/home/create-race-form";
import { JoinRaceForm } from "@/components/home/join-race-form";
import { StartActions } from "@/components/home/start-actions";

const LOGIN_STORAGE_KEY = "rodizio-race-login";

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();

  // ESTADOS PRINCIPAIS
  const [playerName, setPlayerName] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodType | null>(null);
  const [flow, setFlow] = useState<"create" | "join" | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [hasEditedName, setHasEditedName] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [defaultAvatar, setDefaultAvatar] = useState<string | null>(
    DEFAULT_AVATAR
  );

  // ESTADOS DE CONTA
  const [accountFlow, setAccountFlow] = useState<"login" | "create" | null>(
    null
  );
  const [accountCodeInput, setAccountCodeInput] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [loginCode, setLoginCode] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [myGroups, setMyGroups] = useState<Race[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

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

  const toggleHistory = () => {
    if (!showHistory && myGroups.length === 0) {
      handleLoadGroups();
    }
    setShowHistory(!showHistory);
    setCurrentPage(1);
  };

  const foodTypes = [
    { type: "pizza" as FoodType, label: "Pizza", icon: Pizza },
    { type: "sushi" as FoodType, label: "Japa", icon: Fish },
    { type: "burger" as FoodType, label: "Burger", icon: Beef },
  ];

  useEffect(() => {
    const storedLogin = localStorage.getItem(LOGIN_STORAGE_KEY);
    if (storedLogin) setLoginCode(storedLogin);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadDefaultAvatar = async () => {
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

  // --- LÓGICA DE CONTA ---

  const handleCreateLogin = async () => {
    if (!accountPassword.trim() || !accountCodeInput.trim()) return;
    setAccountLoading(true);
    setGroupsError(null);
    try {
      const supabase = createClient();
      const normalizedName = accountCodeInput.trim().toUpperCase();

      const { data, error } = await supabase.rpc("create_login", {
        p_username: normalizedName,
        p_password: accountPassword,
      });

      if (error) throw error;

      setLoginCode(data);
      localStorage.setItem(LOGIN_STORAGE_KEY, data);
      setAccountFlow(null);
      setAccountPassword("");
      setAccountCodeInput("");
      alert("Conta criada com sucesso!");
    } catch (error: any) {
      alert(`Erro ao criar conta: ${error.message || "Tente outro nome"}`);
    } finally {
      setAccountLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!accountCodeInput.trim() || !accountPassword.trim()) return;
    setAccountLoading(true);
    try {
      const supabase = createClient();
      const normalizedName = accountCodeInput.trim().toUpperCase();

      const { data, error } = await supabase.rpc("verify_login", {
        p_username: normalizedName, // Nome do parâmetro corrigido para o banco
        p_password: accountPassword,
      });

      if (error || !data) {
        alert("Nome de usuário ou senha inválidos.");
        return;
      }

      setLoginCode(normalizedName);
      localStorage.setItem(LOGIN_STORAGE_KEY, normalizedName);
      setAccountFlow(null);
      setAccountPassword("");
      setAccountCodeInput("");

      handleLoadGroups(normalizedName);
    } catch (error: any) {
      alert("Erro ao entrar. Tente novamente.");
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
          created_at
        )
      `
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
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setMyGroups(history);
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
      }
      return next;
    });
  };

  const handleChangePassword = async () => {
    if (!loginCode) return;
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
        p_username: loginCode.trim().toUpperCase(),
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
  // --- LÓGICA DAS SALAS ---

  const handleCreateRoom = async () => {
    const normalizedName = playerName.trim();
    const roomOwnerName = loginCode?.trim() || normalizedName;
    if (!normalizedName || !roomOwnerName || !selectedFood) return;
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
        })
        .select()
        .single();

      if (raceError && isMissingColumn(raceError, "is_team_mode")) {
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

      const { data: participant } = await insertParticipantWithFallback(
        supabase,
        {
          race_id: race.id,
          name: normalizedName,
          items_eaten: 0,
          avatar: defaultAvatar,
          is_vip: true,
          login_code: loginCode,
        }
      );
      if (participant)
        localStorage.setItem(getParticipantStorageKey(code), participant.id);
      router.push(`/sala/${code}`);
    } catch (e) {
      alert("Erro ao criar sala.");
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
        .select("id")
        .eq("race_id", race.id)
        .eq("name", normalizedName)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingParticipant) {
        // Se encontrar, re-associa o usuário ao registro antigo (mantém o status VIP se houver)
        localStorage.setItem(
          getParticipantStorageKey(normalized),
          existingParticipant.id
        );
        router.push(`/sala/${normalized}`);
        return;
      }

      // 3. Se não encontrar, cria um novo participante
      const { data: participant, error: pError } =
        await insertParticipantWithFallback(supabase, {
          race_id: race.id,
          name: normalizedName,
          items_eaten: 0,
          team: null,
          avatar: defaultAvatar,
          is_vip: false,
          login_code: loginCode,
        });

      if (pError) throw pError;
      if (participant)
        localStorage.setItem(
          getParticipantStorageKey(normalized),
          participant.id
        );

      router.push(`/sala/${normalized}`);
    } catch (e: any) {
      alert(e.message);
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
                  className="inline-flex items-center rounded-xl border border-muted/60 bg-background/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur transition hover:border-primary/40 hover:text-primary"
                >
                  <Settings className="mr-2 h-3.5 w-3.5" />
                  {t.common.connected_as} &quot;{loginCode}&quot;
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
                  onMenuStateChange={setIsAccountMenuOpen}
                  router={router}
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

              {!isAccountMenuOpen &&
                (!flow ? (
                  <StartActions onSetFlow={setFlow} />
                ) : flow === "create" ? (
                <CreateRaceForm
                  playerName={playerName}
                  setPlayerName={handlePlayerNameChange}
                  isTeamMode={isTeamMode}
                  setIsTeamMode={setIsTeamMode}
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
    </div>
  );
}

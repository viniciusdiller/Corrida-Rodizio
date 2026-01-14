"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Pizza, Fish, Beef } from "lucide-react";
import type { FoodType, Race } from "@/types/database";
import { generateRoomCode } from "@/lib/utils/room-code";
import { getParticipantStorageKey } from "@/lib/utils/participant-storage";
import { DEFAULT_AVATAR } from "@/lib/utils/avatars";

// Componentes refatorados
import { HomeHeader } from "@/components/home/home-header";
import { AccountSection } from "@/components/home/account-section";
import { CreateRaceForm } from "@/components/home/create-race-form";
import { JoinRaceForm } from "@/components/home/join-race-form";
import { StartActions } from "@/components/home/start-actions";

const LOGIN_STORAGE_KEY = "rodizio-race-login";

export default function Home() {
  const router = useRouter();

  // ESTADOS PRINCIPAIS
  const [playerName, setPlayerName] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodType | null>(null);
  const [flow, setFlow] = useState<"create" | "join" | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTeamMode, setIsTeamMode] = useState(false);

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

  const foodTypes = [
    { type: "pizza" as FoodType, label: "Pizza", icon: Pizza },
    { type: "sushi" as FoodType, label: "Japa", icon: Fish },
    { type: "burger" as FoodType, label: "Burger", icon: Beef },
  ];

  useEffect(() => {
    const storedLogin = localStorage.getItem(LOGIN_STORAGE_KEY);
    if (storedLogin) setLoginCode(storedLogin);
  }, []);

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
    // 1. Validação básica: agora exigimos nome e senha
    if (!accountCodeInput.trim() || !accountPassword.trim()) {
      alert("Por favor, preencha o nome de usuário e a senha.");
      return;
    }

    setAccountLoading(true);
    setGroupsError(null);

    try {
      const supabase = createClient();
      const chosenName = accountCodeInput.trim().toUpperCase();

      // Chamamos a função RPC enviando o nome escolhido em 'p_code'
      const { data, error } = await supabase.rpc("create_login", {
        p_code: chosenName,
        p_password: accountPassword,
      });

      if (error) {
        console.error("Erro Supabase:", error);
        throw error; // Lança para o catch tratar a mensagem
      }

      setLoginCode(data);
      localStorage.setItem(LOGIN_STORAGE_KEY, data);
      setAccountFlow(null);
      setAccountPassword("");
      setAccountCodeInput("");
      alert(
        "Conta criada com sucesso! Use este nome para salvar seu histórico."
      );
    } catch (error: any) {
      console.error("Erro detalhado:", error);
      // Extrai a mensagem real do erro (ex: 'usuário já existe')
      const msg =
        error.message ||
        (typeof error === "object" ? JSON.stringify(error) : error);
      alert(`Erro ao criar conta: ${msg}`);
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
        p_code: normalizedName,
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

      // Carrega o histórico de partidas deste usuário
      handleLoadGroups();
    } catch (error: any) {
      alert("Erro ao entrar. Tente novamente.");
    } finally {
      setAccountLoading(false);
    }
  };

  const handleLogout = () => {
    setLoginCode(null);
    setMyGroups([]);
    localStorage.removeItem(LOGIN_STORAGE_KEY);
  };

  const handleLoadGroups = async (forcedCode?: string) => {
    const codeToUse = forcedCode || loginCode;
    if (!codeToUse) return;

    setIsLoadingGroups(true);
    try {
      const supabase = createClient();
      const { data: rows } = await supabase
        .from("participants")
        .select("race_id")
        .eq("login_code", codeToUse);

      const ids = Array.from(new Set((rows || []).map((r) => r.race_id)));
      if (ids.length === 0) {
        setMyGroups([]);
        return;
      }

      const { data } = await supabase
        .from("races")
        .select()
        .in("id", ids)
        .order("created_at", { ascending: false });

      setMyGroups(data || []);
    } catch (e) {
      setGroupsError("Erro ao carregar histórico.");
    } finally {
      setIsLoadingGroups(false);
    }
  };

  // --- LÓGICA DAS SALAS ---

  const handleCreateRoom = async () => {
    if (!playerName.trim() || !selectedFood) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const code = generateRoomCode();

      let { data: race, error: raceError } = await supabase
        .from("races")
        .insert({
          name: `Sala de ${playerName}`,
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
            name: `Sala de ${playerName}`,
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
          name: playerName,
          items_eaten: 0,
          avatar: DEFAULT_AVATAR,
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
    if (!playerName.trim() || !roomCode.trim()) return;
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

      // 2. Tentar encontrar um participante existente com este nome nesta sala
      const { data: existingParticipant } = await supabase
        .from("participants")
        .select("id")
        .eq("race_id", race.id)
        .eq("name", playerName.trim())
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
          name: playerName,
          items_eaten: 0,
          team: null,
          avatar: DEFAULT_AVATAR,
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-orange-100/50 via-background to-background dark:from-purple-950/50 dark:via-black dark:to-black p-6 md:p-12 transition-colors duration-500">
      <div className="mx-auto max-w-xl space-y-12">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <HomeHeader />

        <Card className="border-none shadow-2xl shadow-black/5 bg-card/80 backdrop-blur-md">
          <CardContent className="pt-8 space-y-8">
            <AccountSection
              loginCode={loginCode}
              accountFlow={accountFlow}
              accountLoading={accountLoading}
              accountCodeInput={accountCodeInput}
              accountPassword={accountPassword}
              myGroups={myGroups}
              isLoadingGroups={isLoadingGroups}
              groupsError={groupsError}
              onLogout={handleLogout}
              onLoadGroups={handleLoadGroups}
              onLogin={handleLogin}
              onCreateLogin={handleCreateLogin}
              setAccountFlow={setAccountFlow}
              setAccountCodeInput={setAccountCodeInput}
              setAccountPassword={setAccountPassword}
              router={router}
            />

            {!flow ? (
              <StartActions onSetFlow={setFlow} />
            ) : flow === "create" ? (
              <CreateRaceForm
                playerName={playerName}
                setPlayerName={setPlayerName}
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
                setPlayerName={setPlayerName}
                roomCode={roomCode}
                setRoomCode={setRoomCode}
                loading={loading}
                onJoin={handleJoinRoom}
                onBack={() => {
                  setFlow(null);
                  setRoomCode("");
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

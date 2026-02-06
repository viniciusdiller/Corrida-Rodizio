"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { getFoodTypeLabel } from "@/lib/utils/food-type";
import { getParticipantStorageKey } from "@/lib/utils/participant-storage";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { LogIn, User, Loader2 } from "lucide-react";
import type { Race } from "@/types/database";
import { toast } from "sonner";

interface JoinRoomViaLinkProps {
  race: Race;
  roomCode: string;
  onJoin: () => void;
  onBack: () => void;
}

export function JoinRoomViaLink({
  race,
  roomCode,
  onJoin,
  onBack,
}: JoinRoomViaLinkProps) {
  const { t, language } = useLanguage();
  const foodTypeLabel = getFoodTypeLabel(race.food_type, language);
  const [mode, setMode] = useState<"guest" | "login">("guest");
  const [loading, setLoading] = useState(false);

  // Estados do formulário
  const [nickname, setNickname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleJoinAsGuest = async () => {
    if (!nickname.trim()) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const normalizedNickname = nickname.trim();
      const { data: existingByName } = await supabase
        .from("participants")
        .select("id, login_code")
        .eq("race_id", race.id)
        .ilike("name", normalizedNickname)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const storageKey = getParticipantStorageKey(roomCode);

      if (existingByName) {
        if (existingByName.login_code) {
          toast.error(
            t.room?.codename_taken ??
              "Outro jogador já está usando esse codinome.",
          );
          return;
        }

        localStorage.setItem(storageKey, existingByName.id);
        onJoin();
        return;
      }

      const { data: newParticipant, error } = await supabase
        .from("participants")
        .insert({
          race_id: race.id,
          name: normalizedNickname,
          items_eaten: 0,
        })
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem(storageKey, newParticipant.id);

      onJoin();
    } catch (error) {
      console.error("Erro ao entrar como convidado:", error);
      toast.error("Erro ao entrar na sala. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAndJoin = async () => {
    if (!username.trim() || !password.trim()) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const normalizedUsername = username.trim().toUpperCase();

      // 1. Verificar credenciais
      const { data: loginSuccess, error: loginError } = await supabase.rpc(
        "verify_login",
        {
          p_username: normalizedUsername,
          p_password: password,
        },
      );

      if (loginError || !loginSuccess) {
        toast.error("Usuário ou senha inválidos.");
        setLoading(false);
        return;
      }

      // 2. Salvar login globalmente
      localStorage.setItem("rodizio-race-login", normalizedUsername);

      // 3. Verificar se já existe participante nesta sala com este login
      const { data: existingParticipant } = await supabase
        .from("participants")
        .select("id")
        .eq("race_id", race.id)
        .eq("login_code", normalizedUsername)
        .maybeSingle();

      const storageKey = getParticipantStorageKey(roomCode);

      if (existingParticipant) {
        // Se já existe, apenas reconecta
        localStorage.setItem(storageKey, existingParticipant.id);
      } else {
        const { data: existingByName } = await supabase
          .from("participants")
          .select("id, login_code")
          .eq("race_id", race.id)
          .ilike("name", normalizedUsername)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingByName) {
          if (!existingByName.login_code) {
            toast.error(
              t.room?.codename_taken ??
                "Outro jogador já está usando esse codinome.",
            );
            return;
          }

          if (existingByName.login_code !== normalizedUsername) {
            toast.error(
              t.room?.codename_taken ??
                "Outro jogador já está usando esse codinome.",
            );
            return;
          }

          localStorage.setItem(storageKey, existingByName.id);
          onJoin();
          return;
        }

        // Se não existe, cria um novo vinculado à conta
        const { data: newParticipant, error: insertError } = await supabase
          .from("participants")
          .insert({
            race_id: race.id,
            name: normalizedUsername, // Nome padrão é o usuário
            items_eaten: 0,
            login_code: normalizedUsername,
            is_vip: false, // VIP logicamente seria tratado no backend ou triggers, mas aqui vai false padrão
          })
          .select()
          .single();

        if (insertError) throw insertError;
        localStorage.setItem(storageKey, newParticipant.id);
      }

      onJoin();
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast.error("Erro ao entrar com a conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-orange-100/50 via-background to-background dark:from-purple-950/50 dark:via-black dark:to-black p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex w-full justify-end space-between gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-tight text-primary">
            {t.room.join_via_link_title}
          </h1>
          <p className="text-muted-foreground">
            {t.room.competition_of}{" "}
            <span className="font-bold text-foreground">{foodTypeLabel}</span>
          </p>
        </div>

        <Card className="p-1 border-2 border-primary/20 shadow-xl bg-background/60 backdrop-blur overflow-hidden">
          {/* Tabs Simplificadas */}
          <div className="grid grid-cols-2 p-1 gap-1 bg-muted/50 rounded-lg mb-4 m-2">
            <button
              onClick={() => setMode("guest")}
              className={`text-xs font-bold uppercase py-2 rounded-md transition-all ${
                mode === "guest"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.account?.guest || "Entrar como Convidado"}
            </button>
            <button
              onClick={() => setMode("login")}
              className={`text-xs font-bold uppercase py-2 rounded-md transition-all ${
                mode === "login"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.account?.enter_btn || "Entrar com Conta"}
            </button>
          </div>

          <div className="p-4 pt-0 space-y-4">
            {mode === "guest" ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="space-y-2">
                  <Label>{t.room.enter_nickname_to_join}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="h-11 pl-9 text-lg"
                      autoFocus
                      placeholder={t.account.username_placeholder}
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleJoinAsGuest();
                      }}
                    />
                  </div>
                </div>
                <Button
                  className="w-full h-11 text-lg font-bold uppercase rounded-xl"
                  onClick={handleJoinAsGuest}
                  disabled={loading || !nickname.trim()}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    t.room.join_action
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label>{t.account.username_label}</Label>
                  <Input
                    className="h-11 text-lg"
                    placeholder={t.account.username_placeholder}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.account.password_label}</Label>
                  <Input
                    type="password"
                    className="h-11 text-lg"
                    placeholder="******"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLoginAndJoin();
                    }}
                  />
                </div>
                <Button
                  className="w-full h-11 text-lg font-bold uppercase rounded-xl"
                  onClick={handleLoginAndJoin}
                  disabled={loading || !username.trim() || !password.trim()}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      {t.account.login_btn}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={onBack}>
            {t.common.back}
          </Button>
        </div>
      </div>
    </div>
  );
}

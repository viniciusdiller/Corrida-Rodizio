"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { getFoodTypeLabel } from "@/lib/utils/food-type";
import {
  getLegacyParticipantStorageKey,
  getParticipantStorageKey,
} from "@/lib/utils/participant-storage";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { LogIn, User, Loader2 } from "lucide-react";
import type { Race } from "@/types/database";
import { toast } from "sonner";
import { isAlphanumericOnly, sanitizeAlphanumeric } from "@/lib/utils/username-validation";

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
  const router = useRouter();
  const { t, language } = useLanguage();
  const foodTypeLabel = getFoodTypeLabel(race.food_type, language);
  const [mode, setMode] = useState<"guest" | "login" | "spectator">("guest");
  const [loading, setLoading] = useState(false);
  const [storedLogin, setStoredLogin] = useState<string | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginStep, setLoginStep] = useState<"credentials" | "nickname">(
    "credentials",
  );
  const [pendingLogin, setPendingLogin] = useState<string | null>(null);

  const [nickname, setNickname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("rodizio-race-login");
    const normalized = stored?.trim().toUpperCase() || null;
    setStoredLogin(normalized);
    setShowLoginForm(!normalized);
  }, []);

  useEffect(() => {
    if (mode !== "login") return;
    if (!storedLogin) {
      setLoginStep("credentials");
      setPendingLogin(null);
    }
  }, [mode, storedLogin]);

  const handleJoinAsGuest = async () => {
    if (!nickname.trim()) return;
    const normalizedNickname = nickname.trim();
    if (!isAlphanumericOnly(normalizedNickname)) {
      toast.error(t.account.username_format_invalid);
      return;
    }
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: existingByName } = await supabase
        .from("participants")
        .select("id, login_code")
        .eq("race_id", race.id)
        .ilike("name", normalizedNickname)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const storageKey = getParticipantStorageKey(roomCode, null);

      if (existingByName) {
        const existingLogin = existingByName.login_code?.trim().toUpperCase();
        if (existingLogin) {
          toast.error(
            t.room?.codename_taken ??
              t.room.codename_taken,
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
          login_code: null,
        })
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem(storageKey, newParticipant.id);
      onJoin();
    } catch (error) {
      console.error("Erro ao entrar como convidado:", error);
      toast.error(t.join_room_via_link.join_room_error);
    } finally {
      setLoading(false);
    }
  };

  const joinWithLogin = async (
    normalizedUsername: string,
    desiredName: string,
  ) => {
    const supabase = createClient();
    const { data: existingParticipant } = await supabase
      .from("participants")
      .select("id")
      .eq("race_id", race.id)
      .eq("login_code", normalizedUsername)
      .maybeSingle();

    const storageKey = getParticipantStorageKey(roomCode, normalizedUsername);

    if (existingParticipant) {
      const { data: nameConflict } = await supabase
        .from("participants")
        .select("id, login_code")
        .eq("race_id", race.id)
        .ilike("name", desiredName)
        .neq("id", existingParticipant.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (nameConflict && nameConflict.login_code !== normalizedUsername) {
        toast.error(
          t.room?.codename_taken ??
            t.room.codename_taken,
        );
        return;
      }

      await supabase
        .from("participants")
        .update({ name: desiredName })
        .eq("id", existingParticipant.id);

      localStorage.setItem(storageKey, existingParticipant.id);
      onJoin();
      return;
    }

    const { data: existingByName } = await supabase
      .from("participants")
      .select("id, login_code")
      .eq("race_id", race.id)
      .ilike("name", desiredName)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingByName) {
      if (!existingByName.login_code) {
        await supabase
          .from("participants")
          .update({ login_code: normalizedUsername, name: desiredName })
          .eq("id", existingByName.id);
        localStorage.setItem(storageKey, existingByName.id);
        onJoin();
        return;
      }

      if (existingByName.login_code !== normalizedUsername) {
        toast.error(
          t.room?.codename_taken ??
            t.room.codename_taken,
        );
        return;
      }

      localStorage.setItem(storageKey, existingByName.id);
      await supabase
        .from("participants")
        .update({ name: desiredName })
        .eq("id", existingByName.id);
      onJoin();
      return;
    }

    const { data: newParticipant, error: insertError } = await supabase
      .from("participants")
      .insert({
        race_id: race.id,
        name: desiredName,
        items_eaten: 0,
        login_code: normalizedUsername,
        is_vip: false,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    localStorage.setItem(storageKey, newParticipant.id);
    onJoin();
  };

  const handleJoinAsLogged = async () => {
    if (!storedLogin) return;
    setLoading(true);

    try {
      const normalizedUsername = storedLogin.trim().toUpperCase();
      const desiredName = nickname.trim() || normalizedUsername;
      if (!isAlphanumericOnly(desiredName)) {
        toast.error(t.account.username_format_invalid);
        return;
      }

      localStorage.setItem("rodizio-race-login", normalizedUsername);
      localStorage.removeItem(getLegacyParticipantStorageKey(roomCode));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rodizio-login-updated"));
      }
      await joinWithLogin(normalizedUsername, desiredName);
    } catch (error) {
      console.error("Erro ao entrar com a conta:", error);
      toast.error(t.join_room_via_link.login_join_error);
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
      if (!isAlphanumericOnly(normalizedUsername)) {
        toast.error(t.account.username_format_invalid);
        return;
      }

      const { data: loginSuccess, error: loginError } = await supabase.rpc(
        "verify_login",
        {
          p_username: normalizedUsername,
          p_password: password,
        },
      );

      if (loginError || !loginSuccess) {
        toast.error(t.account.invalid_credentials);
        setLoading(false);
        return;
      }

      localStorage.setItem("rodizio-race-login", normalizedUsername);
      localStorage.removeItem(getLegacyParticipantStorageKey(roomCode));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("rodizio-login-updated"));
      }
      setStoredLogin(normalizedUsername);

      const { data: existingParticipant } = await supabase
        .from("participants")
        .select("id")
        .eq("race_id", race.id)
        .eq("login_code", normalizedUsername)
        .maybeSingle();

      if (existingParticipant) {
        const storageKey = getParticipantStorageKey(roomCode, normalizedUsername);
        localStorage.setItem(storageKey, existingParticipant.id);
        onJoin();
        return;
      }

      setPendingLogin(normalizedUsername);
      setNickname(normalizedUsername);
      setLoginStep("nickname");
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast.error(t.join_room_via_link.login_join_error);
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
          <div className="grid grid-cols-3 p-1 gap-1 bg-muted/50 rounded-lg mb-4 m-2">
            <button
              onClick={() => setMode("guest")}
              className={`text-xs font-bold uppercase py-2 rounded-md transition-all ${
                mode === "guest"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.account?.guest || t.join_room_via_link.enter_as_guest}
            </button>
            <button
              onClick={() => setMode("login")}
              className={`text-xs font-bold uppercase py-2 rounded-md transition-all ${
                mode === "login"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.account?.enter_btn || t.join_room_via_link.enter_with_account}
            </button>
            <button
              onClick={() => setMode("spectator")}
              className={`text-xs font-bold uppercase py-2 rounded-md transition-all ${
                mode === "spectator"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.home.enter_spectator}
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
                      onChange={(e) => setNickname(sanitizeAlphanumeric(e.target.value))}
                      maxLength={20}
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
            ) : mode === "login" ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {storedLogin && !showLoginForm ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>{t.room.enter_nickname_to_join}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="h-11 pl-9 text-lg"
                          placeholder={t.account.username_placeholder}
                          value={nickname}
                          onChange={(e) => setNickname(sanitizeAlphanumeric(e.target.value))}
                          maxLength={20}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.account.logged_as}{" "}
                      <span className="font-semibold text-foreground">
                        {storedLogin}
                      </span>
                    </p>
                    <Button
                      className="w-full h-11 text-lg font-bold uppercase rounded-xl"
                      onClick={handleJoinAsLogged}
                      disabled={loading}
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
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-xs uppercase tracking-widest"
                      onClick={() => {
                        setShowLoginForm(true);
                        setLoginStep("credentials");
                        setPendingLogin(null);
                      }}
                    >
                      {t.account.use_other_account}
                    </Button>
                  </div>
                ) : (
                  <>
                    {loginStep === "credentials" ? (
                      <>
                        <div className="space-y-2">
                          <Label>{t.account.username_label}</Label>
                          <Input
                            className="h-11 text-lg"
                            placeholder={t.account.username_placeholder}
                            value={username}
                            onChange={(e) => setUsername(sanitizeAlphanumeric(e.target.value))}
                            maxLength={20}
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
                          disabled={
                            loading || !username.trim() || !password.trim()
                          }
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
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>{t.room.enter_nickname_to_join}</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              className="h-11 pl-9 text-lg"
                              placeholder={t.account.username_placeholder}
                              value={nickname}
                              onChange={(e) => setNickname(sanitizeAlphanumeric(e.target.value))}
                              maxLength={20}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && pendingLogin) {
                                  const desiredName = nickname.trim() || pendingLogin;
                                  if (!isAlphanumericOnly(desiredName)) {
                                    toast.error(t.account.username_format_invalid);
                                    return;
                                  }
                                  setLoading(true);
                                  joinWithLogin(
                                    pendingLogin,
                                    desiredName,
                                  )
                                    .catch((error) => {
                                      console.error(error);
                                      toast.error(
                                        t.join_room_via_link.login_join_error,
                                      );
                                    })
                                    .finally(() => setLoading(false));
                                }
                              }}
                            />
                          </div>
                        </div>
                        <Button
                          className="w-full h-11 text-lg font-bold uppercase rounded-xl"
                          onClick={() => {
                            if (!pendingLogin) return;
                            const desiredName = nickname.trim() || pendingLogin;
                            if (!isAlphanumericOnly(desiredName)) {
                              toast.error(t.account.username_format_invalid);
                              return;
                            }
                            setLoading(true);
                            joinWithLogin(
                              pendingLogin,
                              desiredName,
                            )
                              .catch((error) => {
                                console.error(error);
                                toast.error(
                                  t.join_room_via_link.login_join_error,
                                );
                              })
                              .finally(() => setLoading(false));
                          }}
                          disabled={loading || !pendingLogin}
                        >
                          {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            t.room.join_action
                          )}
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                <p className="text-xs text-muted-foreground">
                  {t.home.spectator_desc}
                </p>
                <Button
                  className="w-full h-11 text-lg font-bold uppercase rounded-xl"
                  onClick={() => router.push(`/sala/${roomCode}?spectator=1`)}
                >
                  {t.home.enter_spectator}
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

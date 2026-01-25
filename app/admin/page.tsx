"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type AdminUser = {
  username: string;
  isPremium: boolean;
  exclusiveAvatars: string[];
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  const [newExclusiveAvatar, setNewExclusiveAvatar] = useState("");
  const [exclusiveStatus, setExclusiveStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch("/api/admin/session");
        const data = await response.json();
        setIsAuthenticated(!!data?.authenticated);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    loadSession();
  }, []);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setLoginError(data?.error || "Invalid password");
        return;
      }
      setIsAuthenticated(true);
      setLoginPassword("");
    } catch {
      setLoginError("Login failed");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    setIsAuthenticated(false);
    setUser(null);
  };

  const loadUser = async () => {
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    setIsSearching(true);
    setUserError(null);
    setPasswordStatus(null);
    setExclusiveStatus(null);
    try {
      const supabase = createClient();
      const { data: loginData, error: loginError } = await supabase
        .from("logins")
        .select("username")
        .ilike("username", trimmed)
        .maybeSingle();

      if (loginError || !loginData?.username) {
        setUser(null);
        setUserError("User not found");
        return;
      }

      const { data: profileData } = await supabase
        .from("player_profiles")
        .select("is_premium")
        .eq("login_code", loginData.username)
        .maybeSingle();

      const { data: exclusiveData } = await supabase
        .from("exclusive_avatars")
        .select("avatar")
        .eq("login_code", loginData.username);

      setUser({
        username: loginData.username,
        isPremium: !!profileData?.is_premium,
        exclusiveAvatars: Array.isArray(exclusiveData)
          ? exclusiveData.map((row) => row.avatar)
          : [],
      });
    } finally {
      setIsSearching(false);
    }
  };

  const updatePremium = async (value: boolean) => {
    if (!user) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("player_profiles")
      .upsert(
        { login_code: user.username, is_premium: value },
        { onConflict: "login_code" }
      );

    if (!error) {
      setUser({ ...user, isPremium: value });
    }
  };

  const resetPassword = async () => {
    if (!user) return;
    setPasswordStatus(null);
    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordStatus("Passwords do not match");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.rpc("reset_login_password", {
      p_username: user.username,
      p_password: newPassword,
    });

    if (error) {
      setPasswordStatus("Failed to reset password");
      return;
    }

    setPasswordStatus("Password updated");
    setNewPassword("");
    setConfirmPassword("");
  };

  const addExclusiveAvatar = async () => {
    if (!user) return;
    const avatarName = newExclusiveAvatar.trim();
    if (!avatarName) return;
    setExclusiveStatus(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("exclusive_avatars")
      .upsert(
        { login_code: user.username, avatar: avatarName },
        { onConflict: "login_code,avatar" }
      );

    if (error) {
      setExclusiveStatus("Failed to add avatar");
      return;
    }

    setUser({
      ...user,
      exclusiveAvatars: Array.from(
        new Set([...user.exclusiveAvatars, avatarName])
      ),
    });
    setNewExclusiveAvatar("");
  };

  const removeExclusiveAvatar = async (avatarName: string) => {
    if (!user) return;
    setExclusiveStatus(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("exclusive_avatars")
      .delete()
      .eq("login_code", user.username)
      .eq("avatar", avatarName);

    if (error) {
      setExclusiveStatus("Failed to remove avatar");
      return;
    }

    setUser({
      ...user,
      exclusiveAvatars: user.exclusiveAvatars.filter(
        (item) => item !== avatarName
      ),
    });
  };

  if (isCheckingSession) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-orange-100/50 via-background to-background dark:from-purple-950/50 dark:via-black dark:to-black px-6 pb-12 pt-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black uppercase tracking-[0.2em] text-foreground">
            Admin Console
          </h1>
          {isAuthenticated && (
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </div>

        {!isAuthenticated ? (
          <Card className="border-none shadow-2xl shadow-black/5 bg-card/80 backdrop-blur-md">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Admin Password
                </Label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="Enter admin password"
                />
              </div>
              {loginError && (
                <p className="text-xs text-destructive">{loginError}</p>
              )}
              <Button className="w-full" onClick={handleLogin}>
                Login
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-none shadow-2xl shadow-black/5 bg-card/80 backdrop-blur-md">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Search User
                  </Label>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <Input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="USERNAME"
                    />
                    <Button
                      onClick={loadUser}
                      disabled={isSearching}
                      className="md:w-32"
                    >
                      {isSearching ? "Searching..." : "Search"}
                    </Button>
                  </div>
                </div>
                {userError && (
                  <p className="text-xs text-destructive">{userError}</p>
                )}
              </CardContent>
            </Card>

            {user && (
              <Card className="border-none shadow-2xl shadow-black/5 bg-card/80 backdrop-blur-md">
                <CardContent className="pt-6 space-y-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        User
                      </p>
                      <p className="text-lg font-black">{user.username}</p>
                    </div>
                    <Badge
                      className={
                        user.isPremium
                          ? "bg-yellow-500/20 text-yellow-600 border-none"
                          : "bg-muted text-muted-foreground border-none"
                      }
                    >
                      {user.isPremium ? "Premium" : "Standard"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => updatePremium(true)}
                    >
                      Add Premium
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => updatePremium(false)}
                    >
                      Remove Premium
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Reset Password
                    </Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(event) =>
                          setNewPassword(event.target.value)
                        }
                        placeholder="New password"
                      />
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        placeholder="Confirm password"
                      />
                    </div>
                    {passwordStatus && (
                      <p className="text-xs text-muted-foreground">
                        {passwordStatus}
                      </p>
                    )}
                    <Button variant="outline" onClick={resetPassword}>
                      Update Password
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Exclusive Avatars
                    </Label>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <Input
                        value={newExclusiveAvatar}
                        onChange={(event) =>
                          setNewExclusiveAvatar(event.target.value)
                        }
                        placeholder="avatar-exclusive666.png"
                      />
                      <Button
                        variant="outline"
                        onClick={addExclusiveAvatar}
                        className="md:w-32"
                      >
                        Add
                      </Button>
                    </div>
                    {exclusiveStatus && (
                      <p className="text-xs text-muted-foreground">
                        {exclusiveStatus}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {user.exclusiveAvatars.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          No exclusive avatars
                        </span>
                      )}
                      {user.exclusiveAvatars.map((avatar) => (
                        <div
                          key={avatar}
                          className="flex items-center gap-2 rounded-full border border-muted px-3 py-1 text-xs"
                        >
                          <span>{avatar}</span>
                          <button
                            className="text-xs text-destructive"
                            onClick={() => removeExclusiveAvatar(avatar)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

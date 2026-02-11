"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getAvatarUrl,
  isExclusiveAvatar,
  isImageAvatar,
} from "@/lib/utils/avatars";

type AdminUser = {
  username: string;
  isPremium: boolean;
  exclusiveAvatars: string[];
  promoPermissions: string[];
  unlockedPremiumAvatars: string[];
  premiumAvatarClaimCredits: number;
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
  const [newPromoPermission, setNewPromoPermission] = useState("");
  const [promoStatus, setPromoStatus] = useState<string | null>(null);
  const [availableExclusiveAvatars, setAvailableExclusiveAvatars] = useState<
    string[]
  >([]);
  const [showExclusiveMenu, setShowExclusiveMenu] = useState(false);
  const [showPromoMenu, setShowPromoMenu] = useState(false);
  const [newPremiumAvatar, setNewPremiumAvatar] = useState("");
  const [premiumStatus, setPremiumStatus] = useState<string | null>(null);
  const [premiumClaimCreditInput, setPremiumClaimCreditInput] = useState("1");
  const [showPremiumMenu, setShowPremiumMenu] = useState(false);
  const availableExclusiveOptions = user
    ? availableExclusiveAvatars
        .filter((avatar) => isExclusiveAvatar(avatar))
        .filter((avatar) => !user.exclusiveAvatars.includes(avatar))
    : [];
  const availablePromoOptions = user
    ? availableExclusiveAvatars
        .filter((avatar) => isExclusiveAvatar(avatar))
        .filter((avatar) => !user.promoPermissions.includes(avatar))
    : [];
  const availablePremiumOptions = user
    ? availableExclusiveAvatars
        .filter((avatar) => avatar.startsWith("avatar-premium"))
        .filter((avatar) => !user.unlockedPremiumAvatars.includes(avatar))
    : [];

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

  useEffect(() => {
    const loadAvatars = async () => {
      try {
        const response = await fetch("/api/avatars");
        const data = await response.json().catch(() => ({}));
        const avatars = Array.isArray(data?.avatars) ? data.avatars : [];
        setAvailableExclusiveAvatars(avatars);
        const exclusive = avatars.filter((avatar: string) =>
          isExclusiveAvatar(avatar)
        );
        const premium = avatars.filter((avatar: string) =>
          avatar.startsWith("avatar-premium")
        );
        if (!newExclusiveAvatar && exclusive.length > 0) {
          setNewExclusiveAvatar(exclusive[0]);
        }
        if (!newPromoPermission && exclusive.length > 0) {
          setNewPromoPermission(exclusive[0]);
        }
        if (!newPremiumAvatar && premium.length > 0) {
          setNewPremiumAvatar(premium[0]);
        }
      } catch {
        setAvailableExclusiveAvatars([]);
      }
    };

    if (isAuthenticated) {
      loadAvatars();
    }
  }, [isAuthenticated, newExclusiveAvatar, newPromoPermission, newPremiumAvatar]);

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
    setPromoStatus(null);
    setPremiumStatus(null);
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
        .select("is_premium,premium_avatar_claim_credits")
        .eq("login_code", loginData.username)
        .maybeSingle();

      const { data: exclusiveData } = await supabase
        .from("exclusive_avatars")
        .select("avatar")
        .eq("login_code", loginData.username);

      const { data: permissionData } = await supabase
        .from("exclusive_avatar_permissions")
        .select("avatar")
        .eq("login_code", loginData.username);

      const { data: premiumUnlockData } = await supabase
        .from("premium_avatar_unlocks")
        .select("avatar")
        .eq("login_code", loginData.username);

      setUser({
        username: loginData.username,
        isPremium: !!profileData?.is_premium,
        exclusiveAvatars: Array.isArray(exclusiveData)
          ? exclusiveData.map((row) => row.avatar)
          : [],
        promoPermissions: Array.isArray(permissionData)
          ? permissionData.map((row) => row.avatar)
          : [],
        unlockedPremiumAvatars: Array.isArray(premiumUnlockData)
          ? premiumUnlockData.map((row) => row.avatar)
          : [],
        premiumAvatarClaimCredits: Number.isFinite(
          Number(profileData?.premium_avatar_claim_credits),
        )
          ? Math.max(0, Math.floor(Number(profileData?.premium_avatar_claim_credits)))
          : 1,
      });
      setPremiumClaimCreditInput(
        String(
          Number.isFinite(Number(profileData?.premium_avatar_claim_credits))
            ? Math.max(0, Math.floor(Number(profileData?.premium_avatar_claim_credits)))
            : 1,
        ),
      );
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

  const addPromoPermission = async () => {
    if (!user) return;
    const avatarName = newPromoPermission.trim();
    if (!avatarName) return;
    setPromoStatus(null);
    setPremiumStatus(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("exclusive_avatar_permissions")
      .upsert(
        { login_code: user.username, avatar: avatarName },
        { onConflict: "login_code,avatar" }
      );

    if (error) {
      setPromoStatus("Failed to add permission");
      return;
    }

    setUser({
      ...user,
      promoPermissions: Array.from(
        new Set([...user.promoPermissions, avatarName])
      ),
    });
    setNewPromoPermission("");
  };

  const removePromoPermission = async (avatarName: string) => {
    if (!user) return;
    setPromoStatus(null);
    setPremiumStatus(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("exclusive_avatar_permissions")
      .delete()
      .eq("login_code", user.username)
      .eq("avatar", avatarName);

    if (error) {
      setPromoStatus("Failed to remove permission");
      return;
    }

    setUser({
      ...user,
      promoPermissions: user.promoPermissions.filter(
        (item) => item !== avatarName
      ),
    });
  };


  const addPremiumAvatar = async () => {
    if (!user) return;
    const avatarName = newPremiumAvatar.trim();
    if (!avatarName) return;
    setPremiumStatus(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("premium_avatar_unlocks")
      .upsert(
        { login_code: user.username, avatar: avatarName, claimed_from: "admin_console" },
        { onConflict: "login_code,avatar" }
      );

    if (error) {
      setPremiumStatus("Failed to add premium avatar");
      return;
    }

    setUser({
      ...user,
      unlockedPremiumAvatars: Array.from(
        new Set([...user.unlockedPremiumAvatars, avatarName])
      ),
    });
    setNewPremiumAvatar("");
  };

  const removePremiumAvatar = async (avatarName: string) => {
    if (!user) return;
    setPremiumStatus(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("premium_avatar_unlocks")
      .delete()
      .eq("login_code", user.username)
      .eq("avatar", avatarName);

    if (error) {
      setPremiumStatus("Failed to remove premium avatar");
      return;
    }

    setUser({
      ...user,
      unlockedPremiumAvatars: user.unlockedPremiumAvatars.filter(
        (item) => item !== avatarName
      ),
    });
  };
  const updatePremiumClaimCredits = async () => {
    if (!user) return;

    const parsedValue = Number.parseInt(premiumClaimCreditInput, 10);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      setPremiumStatus("Claim credits must be 0 or greater");
      return;
    }

    setPremiumStatus(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("player_profiles")
      .upsert(
        {
          login_code: user.username,
          premium_avatar_claim_credits: parsedValue,
        },
        { onConflict: "login_code" },
      );

    if (error) {
      setPremiumStatus("Failed to update claim credits");
      return;
    }

    setUser({
      ...user,
      premiumAvatarClaimCredits: parsedValue,
    });
    setPremiumStatus("Claim credits updated");
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
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleLogin();
                  }}
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
                      <div className="relative w-full">
                        <button
                          type="button"
                          className={`flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm ${
                            availableExclusiveOptions.length === 0
                              ? "border-muted bg-muted/40 text-muted-foreground cursor-not-allowed"
                              : "border-input bg-background"
                          }`}
                          onClick={() =>
                            setShowExclusiveMenu((prev) => !prev)
                          }
                          disabled={availableExclusiveOptions.length === 0}
                        >
                          {newExclusiveAvatar && isImageAvatar(newExclusiveAvatar) ? (
                            <img
                              src={getAvatarUrl(newExclusiveAvatar)}
                              alt=""
                              className="h-6 w-6 rounded-full object-contain"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No other avatar available
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {showExclusiveMenu ? "▲" : "▼"}
                          </span>
                        </button>
                        {showExclusiveMenu && (
                          <div className="absolute z-20 mt-2 w-full rounded-md border border-muted bg-background p-2 shadow-lg">
                            {availableExclusiveOptions.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                No other avatar available
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {availableExclusiveOptions.map((avatar) => (
                                  <button
                                    key={avatar}
                                    type="button"
                                    className={`h-10 w-10 rounded-md border ${
                                      newExclusiveAvatar === avatar
                                        ? "border-primary"
                                        : "border-muted"
                                    }`}
                                    onClick={() => {
                                      setNewExclusiveAvatar(avatar);
                                      setShowExclusiveMenu(false);
                                    }}
                                  >
                                    {isImageAvatar(avatar) && (
                                      <img
                                        src={getAvatarUrl(avatar)}
                                        alt=""
                                        className="h-8 w-8 rounded-full object-contain"
                                      />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={addExclusiveAvatar}
                        className="md:w-32"
                        disabled={availableExclusiveOptions.length === 0}
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
                          {isImageAvatar(avatar) && (
                            <img
                              src={getAvatarUrl(avatar)}
                              alt=""
                              className="h-6 w-6 rounded-full object-contain"
                            />
                          )}
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

                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Premium Avatars
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Claimed: {user.unlockedPremiumAvatars.length} / Credits:{" "}
                      {user.premiumAvatarClaimCredits}
                    </p>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <Input
                        value={premiumClaimCreditInput}
                        onChange={(event) =>
                          setPremiumClaimCreditInput(event.target.value)
                        }
                        placeholder="Claim credits"
                        inputMode="numeric"
                      />
                      <Button
                        variant="outline"
                        onClick={updatePremiumClaimCredits}
                        className="md:w-40"
                      >
                        Update credits
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <div className="relative w-full">
                        <button
                          type="button"
                          className={`flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm ${
                            availablePremiumOptions.length === 0
                              ? "border-muted bg-muted/40 text-muted-foreground cursor-not-allowed"
                              : "border-input bg-background"
                          }`}
                          onClick={() => setShowPremiumMenu((prev) => !prev)}
                          disabled={availablePremiumOptions.length === 0}
                        >
                          {newPremiumAvatar && isImageAvatar(newPremiumAvatar) ? (
                            <img
                              src={getAvatarUrl(newPremiumAvatar)}
                              alt=""
                              className="h-6 w-6 rounded-full object-contain"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No other premium avatar available
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {showPremiumMenu ? "▲" : "▼"}
                          </span>
                        </button>
                        {showPremiumMenu && (
                          <div className="absolute z-20 mt-2 w-full rounded-md border border-muted bg-background p-2 shadow-lg">
                            {availablePremiumOptions.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                No other premium avatar available
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {availablePremiumOptions.map((avatar) => (
                                  <button
                                    key={avatar}
                                    type="button"
                                    className={`h-10 w-10 rounded-md border ${
                                      newPremiumAvatar === avatar
                                        ? "border-primary"
                                        : "border-muted"
                                    }`}
                                    onClick={() => {
                                      setNewPremiumAvatar(avatar);
                                      setShowPremiumMenu(false);
                                    }}
                                  >
                                    {isImageAvatar(avatar) && (
                                      <img
                                        src={getAvatarUrl(avatar)}
                                        alt=""
                                        className="h-8 w-8 rounded-full object-contain"
                                      />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={addPremiumAvatar}
                        className="md:w-32"
                        disabled={availablePremiumOptions.length === 0}
                      >
                        Add
                      </Button>
                    </div>
                    {premiumStatus && (
                      <p className="text-xs text-muted-foreground">
                        {premiumStatus}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {user.unlockedPremiumAvatars.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          No premium avatars unlocked
                        </span>
                      )}
                      {user.unlockedPremiumAvatars.map((avatar) => (
                        <div
                          key={avatar}
                          className="flex items-center gap-2 rounded-full border border-muted px-3 py-1 text-xs"
                        >
                          {isImageAvatar(avatar) && (
                            <img
                              src={getAvatarUrl(avatar)}
                              alt=""
                              className="h-6 w-6 rounded-full object-contain"
                            />
                          )}
                          <button
                            className="text-xs text-destructive"
                            onClick={() => removePremiumAvatar(avatar)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Permissao de Codigos
                    </Label>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <div className="relative w-full">
                        <button
                          type="button"
                          className={`flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm ${
                            availablePromoOptions.length === 0
                              ? "border-muted bg-muted/40 text-muted-foreground cursor-not-allowed"
                              : "border-input bg-background"
                          }`}
                          onClick={() => setShowPromoMenu((prev) => !prev)}
                          disabled={availablePromoOptions.length === 0}
                        >
                          {newPromoPermission && isImageAvatar(newPromoPermission) ? (
                            <img
                              src={getAvatarUrl(newPromoPermission)}
                              alt=""
                              className="h-6 w-6 rounded-full object-contain"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No other avatar available
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {showPromoMenu ? "▲" : "▼"}
                          </span>
                        </button>
                        {showPromoMenu && (
                          <div className="absolute z-20 mt-2 w-full rounded-md border border-muted bg-background p-2 shadow-lg">
                            {availablePromoOptions.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                No other avatar available
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {availablePromoOptions.map((avatar) => (
                                  <button
                                    key={avatar}
                                    type="button"
                                    className={`h-10 w-10 rounded-md border ${
                                      newPromoPermission === avatar
                                        ? "border-primary"
                                        : "border-muted"
                                    }`}
                                    onClick={() => {
                                      setNewPromoPermission(avatar);
                                      setShowPromoMenu(false);
                                    }}
                                  >
                                    {isImageAvatar(avatar) && (
                                      <img
                                        src={getAvatarUrl(avatar)}
                                        alt=""
                                        className="h-8 w-8 rounded-full object-contain"
                                      />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={addPromoPermission}
                        className="md:w-32"
                        disabled={availablePromoOptions.length === 0}
                      >
                        Add
                      </Button>
                    </div>
                    {promoStatus && (
                      <p className="text-xs text-muted-foreground">
                        {promoStatus}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {user.promoPermissions.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          No promo permissions
                        </span>
                      )}
                      {user.promoPermissions.map((avatar) => (
                        <div
                          key={avatar}
                          className="flex items-center gap-2 rounded-full border border-muted px-3 py-1 text-xs"
                        >
                          {isImageAvatar(avatar) && (
                            <img
                              src={getAvatarUrl(avatar)}
                              alt=""
                              className="h-6 w-6 rounded-full object-contain"
                            />
                          )}
                          <button
                            className="text-xs text-destructive"
                            onClick={() => removePromoPermission(avatar)}
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

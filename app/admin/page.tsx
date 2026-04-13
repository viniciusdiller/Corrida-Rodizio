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

type AdminStats = {
  raceCount: number;
  activeRacesCount: number;
  playersWithoutAccountCount: number;
  accountCount: number;
  totalItemsCount: number;
  photoCount: number;
  lastActivityAt: string | null;
};

type AdminNotificationTarget =
  | "specific_player"
  | "premiums_only"
  | "free_only"
  | "no_recovery_email"
  | "all";

type AdminCampaign = {
  body: string;
  created_at: string;
  deliver_in_app: boolean;
  deliver_push: boolean;
  href: string | null;
  id: string;
  in_app_count: number;
  matched_count: number;
  push_count: number;
  repeat_day_of_month: number | null;
  repeat_end_at: string | null;
  repeat_start_at: string | null;
  repeat_type: "none" | "weekly_window" | "monthly_window" | "day_of_month";
  scheduled_for: string | null;
  sent_at: string | null;
  status: "draft" | "scheduled" | "sent" | "cancelled";
  target_login_code: string | null;
  target_type: AdminNotificationTarget;
  template_key: string | null;
  title: string;
};

type AdminTab = "statistics" | "user_management" | "notifications";

const EMPTY_STATS: AdminStats = {
  raceCount: 0,
  activeRacesCount: 0,
  playersWithoutAccountCount: 0,
  accountCount: 0,
  totalItemsCount: 0,
  photoCount: 0,
  lastActivityAt: null,
};

const notificationTargetOptions: Array<{
  label: string;
  value: AdminNotificationTarget;
}> = [
  { label: "Specific player", value: "specific_player" },
  { label: "Premiums only", value: "premiums_only" },
  { label: "Free only", value: "free_only" },
  { label: "No recovery email", value: "no_recovery_email" },
  { label: "All", value: "all" },
];

const scheduledTemplateOptions = [
  {
    body: "Add a recovery email in your account settings to protect access to your account.",
    key: "recovery_email_reminder",
    title: "Recovery email reminder",
  },
  {
    body: "A new event is coming soon. Open the app to see the details and join early.",
    key: "event_announcement",
    title: "New event coming",
  },
  {
    body: "We have an important update live in the app. Open Rodizio Race to check what changed.",
    key: "major_update",
    title: "Major app update",
  },
] as const;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("statistics");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [allUsernames, setAllUsernames] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [composerTitle, setComposerTitle] = useState("");
  const [composerMessage, setComposerMessage] = useState("");
  const [composerTargetType, setComposerTargetType] =
    useState<AdminNotificationTarget>("all");
  const [composerTargetLoginCode, setComposerTargetLoginCode] = useState("");
  const [composerHref, setComposerHref] = useState("");
  const [composerInApp, setComposerInApp] = useState(true);
  const [composerPush, setComposerPush] = useState(false);
  const [composerStatus, setComposerStatus] = useState<string | null>(null);
  const [isSendingComposer, setIsSendingComposer] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [scheduleTargetType, setScheduleTargetType] =
    useState<AdminNotificationTarget>("no_recovery_email");
  const [scheduleTargetLoginCode, setScheduleTargetLoginCode] = useState("");
  const [scheduleHref, setScheduleHref] = useState("");
  const [scheduleInApp, setScheduleInApp] = useState(true);
  const [schedulePush, setSchedulePush] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [scheduleRepeatType, setScheduleRepeatType] = useState<
    "none" | "weekly_window" | "monthly_window" | "day_of_month"
  >("none");
  const [scheduleRepeatStartAt, setScheduleRepeatStartAt] = useState("");
  const [scheduleRepeatEndAt, setScheduleRepeatEndAt] = useState("");
  const [scheduleRepeatDayOfMonth, setScheduleRepeatDayOfMonth] = useState("1");
  const [scheduleTemplateKey, setScheduleTemplateKey] = useState("");
  const [scheduleStatus, setScheduleStatus] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isRunningSchedules, setIsRunningSchedules] = useState(false);

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
    const loadUsernames = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("logins")
        .select("username")
        .order("username", { ascending: true });

      setAllUsernames(
        Array.isArray(data)
          ? data
              .map((row) => row.username)
              .filter((name): name is string => Boolean(name))
          : []
      );
    };

    if (isAuthenticated) {
      loadUsernames();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoadingStats(true);

      try {
        const params = new URLSearchParams();
        if (user?.username) {
          params.set("username", user.username);
        }

        const response = await fetch(`/api/admin/stats?${params.toString()}`);
        if (!response.ok) {
          setStats(EMPTY_STATS);
          return;
        }

        const data = await response.json().catch(() => ({}));
        setStats({
          raceCount: Number(data?.raceCount ?? 0),
          activeRacesCount: Number(data?.activeRacesCount ?? 0),
          playersWithoutAccountCount: Number(data?.playersWithoutAccountCount ?? 0),
          accountCount: Number(data?.accountCount ?? 0),
          totalItemsCount: Number(data?.totalItemsCount ?? 0),
          photoCount: Number(data?.photoCount ?? 0),
          lastActivityAt:
            typeof data?.lastActivityAt === "string" || data?.lastActivityAt === null
              ? data.lastActivityAt
              : null,
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (isAuthenticated) {
      loadStats();
      return;
    }

    setStats(EMPTY_STATS);
  }, [isAuthenticated, user]);

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

  const loadCampaigns = async () => {
    setIsLoadingCampaigns(true);
    try {
      const response = await fetch("/api/admin/notifications");
      if (!response.ok) {
        setCampaigns([]);
        return;
      }

      const data = await response.json().catch(() => ({}));
      setCampaigns(Array.isArray(data?.campaigns) ? data.campaigns : []);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadCampaigns();
      return;
    }

    setCampaigns([]);
  }, [isAuthenticated]);

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
    const trimmed = searchInput.trim().toUpperCase();
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
      setSearchInput(loginData.username);
    } finally {
      setIsSearching(false);
    }
  };

  const formatLastActivity = (value: string | null) => {
    if (!value) {
      return "No activity yet";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "No activity yet";
    }

    return date.toLocaleString();
  };

  const formatCampaignDate = (value: string | null) => {
    if (!value) return "Not set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not set";
    return date.toLocaleString();
  };

  const describeRepeat = (campaign: AdminCampaign) => {
    if (campaign.repeat_type === "weekly_window") {
      return `Each week from ${formatCampaignDate(campaign.repeat_start_at)} to ${formatCampaignDate(campaign.repeat_end_at)}`;
    }
    if (campaign.repeat_type === "monthly_window") {
      return `Each month from ${formatCampaignDate(campaign.repeat_start_at)} to ${formatCampaignDate(campaign.repeat_end_at)}`;
    }
    if (campaign.repeat_type === "day_of_month") {
      return `Day ${campaign.repeat_day_of_month ?? 1} of the month from ${formatCampaignDate(campaign.repeat_start_at)} to ${formatCampaignDate(campaign.repeat_end_at)}`;
    }
    return "One time";
  };

  const resetComposerForm = () => {
    setComposerTitle("");
    setComposerMessage("");
    setComposerTargetType("all");
    setComposerTargetLoginCode("");
    setComposerHref("");
    setComposerInApp(true);
    setComposerPush(false);
  };

  const resetScheduleForm = () => {
    setScheduleTitle("");
    setScheduleMessage("");
    setScheduleTargetType("no_recovery_email");
    setScheduleTargetLoginCode("");
    setScheduleHref("");
    setScheduleInApp(true);
    setSchedulePush(false);
    setScheduleAt("");
    setScheduleRepeatType("none");
    setScheduleRepeatStartAt("");
    setScheduleRepeatEndAt("");
    setScheduleRepeatDayOfMonth("1");
    setScheduleTemplateKey("");
  };

  const applyScheduleTemplate = (templateKey: string) => {
    setScheduleTemplateKey(templateKey);
    const template = scheduledTemplateOptions.find((item) => item.key === templateKey);
    if (!template) return;
    setScheduleTitle(template.title);
    setScheduleMessage(template.body);
  };

  const submitCampaign = async ({
    href,
    message,
    repeatDayOfMonth,
    repeatEndAt,
    repeatStartAt,
    repeatType,
    scheduledFor,
    targetLoginCode,
    targetType,
    title,
    deliverInApp,
    deliverPush,
    templateKey,
  }: {
    deliverInApp: boolean;
    deliverPush: boolean;
    href: string;
    message: string;
    repeatDayOfMonth?: number;
    repeatEndAt?: string;
    repeatStartAt?: string;
    repeatType?: "none" | "weekly_window" | "monthly_window" | "day_of_month";
    scheduledFor?: string;
    targetLoginCode?: string;
    targetType: AdminNotificationTarget;
    templateKey?: string;
    title: string;
  }) => {
    const response = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliverInApp,
        deliverPush,
        href,
        message,
        repeatDayOfMonth,
        repeatEndAt,
        repeatStartAt,
        repeatType,
        scheduledFor,
        targetLoginCode,
        targetType,
        templateKey,
        title,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(String(data?.error || "Request failed"));
    }

    await loadCampaigns();
    return data;
  };

  const handleSendComposer = async () => {
    setComposerStatus(null);
    if (
      !composerTitle.trim() ||
      !composerMessage.trim() ||
      (!composerInApp && !composerPush) ||
      (composerTargetType === "specific_player" && !composerTargetLoginCode.trim())
    ) {
      setComposerStatus("Fill title, message, target and at least one channel.");
      return;
    }

    setIsSendingComposer(true);
    try {
      await submitCampaign({
        deliverInApp: composerInApp,
        deliverPush: composerPush,
        href: composerHref,
        message: composerMessage,
        targetLoginCode: composerTargetLoginCode,
        targetType: composerTargetType,
        title: composerTitle,
      });
      setComposerStatus("Notification sent.");
      resetComposerForm();
    } catch (error) {
      setComposerStatus(
        error instanceof Error ? error.message : "Failed to send notification",
      );
    } finally {
      setIsSendingComposer(false);
    }
  };

  const handleScheduleCampaign = async () => {
    setScheduleStatus(null);
    if (
      !scheduleTitle.trim() ||
      !scheduleMessage.trim() ||
      !scheduleAt ||
      (!scheduleInApp && !schedulePush) ||
      (scheduleTargetType === "specific_player" && !scheduleTargetLoginCode.trim())
    ) {
      setScheduleStatus("Fill title, message, schedule time, target and one channel.");
      return;
    }
    if (
      scheduleRepeatType !== "none" &&
      (!scheduleRepeatStartAt || !scheduleRepeatEndAt)
    ) {
      setScheduleStatus("Fill repeat start and end dates.");
      return;
    }

    setIsScheduling(true);
    try {
      await submitCampaign({
        deliverInApp: scheduleInApp,
        deliverPush: schedulePush,
        href: scheduleHref,
        message: scheduleMessage,
        repeatDayOfMonth:
          scheduleRepeatType === "day_of_month"
            ? Number(scheduleRepeatDayOfMonth || "1")
            : undefined,
        repeatEndAt: scheduleRepeatEndAt
          ? new Date(scheduleRepeatEndAt).toISOString()
          : undefined,
        repeatStartAt: scheduleRepeatStartAt
          ? new Date(scheduleRepeatStartAt).toISOString()
          : undefined,
        repeatType: scheduleRepeatType,
        scheduledFor: new Date(scheduleAt).toISOString(),
        targetLoginCode: scheduleTargetLoginCode,
        targetType: scheduleTargetType,
        templateKey: scheduleTemplateKey,
        title: scheduleTitle,
      });
      setScheduleStatus("Scheduled notification saved.");
      resetScheduleForm();
    } catch (error) {
      setScheduleStatus(
        error instanceof Error ? error.message : "Failed to schedule notification",
      );
    } finally {
      setIsScheduling(false);
    }
  };

  const handleProcessDueCampaigns = async () => {
    setScheduleStatus(null);
    setIsRunningSchedules(true);
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process_due" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(String(data?.error || "Failed to process scheduled notifications"));
      }
      await loadCampaigns();
      const processed = Array.isArray(data?.campaigns) ? data.campaigns.length : 0;
      setScheduleStatus(
        processed > 0
          ? `${processed} scheduled notification${processed === 1 ? "" : "s"} sent.`
          : "No scheduled notifications were due.",
      );
    } catch (error) {
      setScheduleStatus(
        error instanceof Error ? error.message : "Failed to process scheduled notifications",
      );
    } finally {
      setIsRunningSchedules(false);
    }
  };

  const updateCampaignStatus = async (
    campaignId: string,
    action: "send_now" | "cancel",
  ) => {
    const response = await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, campaignId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(String(data?.error || "Failed to update campaign"));
    }
    await loadCampaigns();
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
  const addPremiumClaimCredits = async () => {
    if (!user) return;

    const parsedValue = Number.parseInt(premiumClaimCreditInput, 10);
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      setPremiumStatus("Claim credits to add must be greater than 0");
      return;
    }

    setPremiumStatus(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("player_profiles")
      .upsert(
        {
          login_code: user.username,
          premium_avatar_claim_credits: user.premiumAvatarClaimCredits + parsedValue,
        },
        { onConflict: "login_code" },
      );

    if (error) {
      setPremiumStatus("Failed to add claim credits");
      return;
    }

    setUser({
      ...user,
      premiumAvatarClaimCredits: user.premiumAvatarClaimCredits + parsedValue,
    });
    setPremiumStatus(`Added ${parsedValue} claim credit${parsedValue === 1 ? "" : "s"}`);
    setPremiumClaimCreditInput("1");
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
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Statistics", value: "statistics" as const },
                { label: "User management", value: "user_management" as const },
                { label: "Notifications", value: "notifications" as const },
              ].map((tab) => (
                <Button
                  key={tab.value}
                  type="button"
                  variant={activeTab === tab.value ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setActiveTab(tab.value)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {activeTab !== "notifications" ? (
            <Card className="border-none shadow-2xl shadow-black/5 bg-card/80 backdrop-blur-md">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  {activeTab === "statistics" ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                          {user ? `Statistics (${user.username})` : "Global Statistics"}
                        </Label>
                        {isLoadingStats && (
                          <span className="text-xs text-muted-foreground">Loading...</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                        <div className="rounded-md border border-muted px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Races
                          </p>
                          <p className="text-lg font-black">{stats.raceCount}</p>
                        </div>
                        <div className="rounded-md border border-muted px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Active races
                          </p>
                          <p className="text-lg font-black">{stats.activeRacesCount}</p>
                        </div>
                        <div className="rounded-md border border-muted px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Players (without account)
                          </p>
                          <p className="text-lg font-black">{stats.playersWithoutAccountCount}</p>
                        </div>
                        <div className="rounded-md border border-muted px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Accounts
                          </p>
                          <p className="text-lg font-black">{stats.accountCount}</p>
                        </div>
                        <div className="rounded-md border border-muted px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Slices / parts total
                          </p>
                          <p className="text-lg font-black">{stats.totalItemsCount}</p>
                        </div>
                        <div className="rounded-md border border-muted px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Photos taken
                          </p>
                          <p className="text-lg font-black">{stats.photoCount}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last activity: {formatLastActivity(stats.lastActivityAt)}
                      </p>
                    </>
                  ) : null}

                  {activeTab === "user_management" ? (
                    <>
                      <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                        Search User
                      </Label>
                      <div className="flex flex-col gap-2">
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={searchInput}
                          onChange={(event) => setSearchInput(event.target.value)}
                        >
                          <option value="">Select a user...</option>
                          {allUsernames.map((username) => (
                            <option key={username} value={username}>
                              {username}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <Input
                          value={searchInput}
                          onChange={(event) => setSearchInput(event.target.value)}
                          placeholder="USERNAME"
                          list="admin-usernames"
                        />
                        <datalist id="admin-usernames">
                          {allUsernames.map((username) => (
                            <option key={username} value={username} />
                          ))}
                        </datalist>
                        <Button
                          onClick={loadUser}
                          disabled={isSearching}
                          className="md:w-32"
                        >
                          {isSearching ? "Searching..." : "Search"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setUser(null);
                            setSearchInput("");
                            setUserError(null);
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </>
                  ) : null}
                </div>
                {userError && (
                  <p className="text-xs text-destructive">{userError}</p>
                )}
              </CardContent>
            </Card>
            ) : null}

            {activeTab === "notifications" ? (
            <Card className="border-none shadow-2xl shadow-black/5 bg-card/80 backdrop-blur-md">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Send Notification
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Immediate admin communication for in-app inbox and push.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <Input
                      value={composerTitle}
                      onChange={(event) => setComposerTitle(event.target.value)}
                      placeholder="Title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Open link</Label>
                    <Input
                      value={composerHref}
                      onChange={(event) => setComposerHref(event.target.value)}
                      placeholder="/ or /sala/ABCD"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Message</Label>
                  <textarea
                    value={composerMessage}
                    onChange={(event) => setComposerMessage(event.target.value)}
                    placeholder="Write the notification text..."
                    className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Target</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={composerTargetType}
                      onChange={(event) =>
                        setComposerTargetType(
                          event.target.value as AdminNotificationTarget,
                        )
                      }
                    >
                      {notificationTargetOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {composerTargetType === "specific_player" ? (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Player code
                      </Label>
                      <Input
                        value={composerTargetLoginCode}
                        onChange={(event) =>
                          setComposerTargetLoginCode(event.target.value.toUpperCase())
                        }
                        placeholder="USERNAME"
                        list="admin-usernames"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-4 rounded-md border border-muted px-3 py-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={composerInApp}
                      onChange={(event) => setComposerInApp(event.target.checked)}
                    />
                    In app
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={composerPush}
                      onChange={(event) => setComposerPush(event.target.checked)}
                    />
                    Push notification
                  </label>
                </div>

                {composerStatus && (
                  <p className="text-xs text-muted-foreground">{composerStatus}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSendComposer} disabled={isSendingComposer}>
                    {isSendingComposer ? "Sending..." : "Send now"}
                  </Button>
                  <Button variant="outline" onClick={resetComposerForm}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
            ) : null}

            {activeTab === "notifications" ? (
            <Card className="border-none shadow-2xl shadow-black/5 bg-card/80 backdrop-blur-md">
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Scheduled Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Queue reminders, events and major updates from one place.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleProcessDueCampaigns}
                    disabled={isRunningSchedules}
                  >
                    {isRunningSchedules ? "Processing..." : "Send due now"}
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Template</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={scheduleTemplateKey}
                      onChange={(event) => applyScheduleTemplate(event.target.value)}
                    >
                      <option value="">Custom</option>
                      {scheduledTemplateOptions.map((template) => (
                        <option key={template.key} value={template.key}>
                          {template.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Send at</Label>
                    <Input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={(event) => setScheduleAt(event.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Repeat</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={scheduleRepeatType}
                      onChange={(event) =>
                        setScheduleRepeatType(
                          event.target.value as
                            | "none"
                            | "weekly_window"
                            | "monthly_window"
                            | "day_of_month",
                        )
                      }
                    >
                      <option value="none">No repeat</option>
                      <option value="weekly_window">Each week from x to x</option>
                      <option value="monthly_window">Each month from x to x</option>
                      <option value="day_of_month">Day X of the month</option>
                    </select>
                  </div>
                  {scheduleRepeatType === "day_of_month" ? (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Day of month
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={scheduleRepeatDayOfMonth}
                        onChange={(event) =>
                          setScheduleRepeatDayOfMonth(event.target.value)
                        }
                      />
                    </div>
                  ) : null}
                </div>

                {scheduleRepeatType !== "none" ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Repeat start
                      </Label>
                      <Input
                        type="datetime-local"
                        value={scheduleRepeatStartAt}
                        onChange={(event) =>
                          setScheduleRepeatStartAt(event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Repeat end
                      </Label>
                      <Input
                        type="datetime-local"
                        value={scheduleRepeatEndAt}
                        onChange={(event) =>
                          setScheduleRepeatEndAt(event.target.value)
                        }
                      />
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Title</Label>
                    <Input
                      value={scheduleTitle}
                      onChange={(event) => setScheduleTitle(event.target.value)}
                      placeholder="Title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Open link</Label>
                    <Input
                      value={scheduleHref}
                      onChange={(event) => setScheduleHref(event.target.value)}
                      placeholder="/ or /sala/ABCD"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Message</Label>
                  <textarea
                    value={scheduleMessage}
                    onChange={(event) => setScheduleMessage(event.target.value)}
                    placeholder="Write the scheduled notification..."
                    className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Target</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={scheduleTargetType}
                      onChange={(event) =>
                        setScheduleTargetType(
                          event.target.value as AdminNotificationTarget,
                        )
                      }
                    >
                      {notificationTargetOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {scheduleTargetType === "specific_player" ? (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Player code
                      </Label>
                      <Input
                        value={scheduleTargetLoginCode}
                        onChange={(event) =>
                          setScheduleTargetLoginCode(event.target.value.toUpperCase())
                        }
                        placeholder="USERNAME"
                        list="admin-usernames"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-4 rounded-md border border-muted px-3 py-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={scheduleInApp}
                      onChange={(event) => setScheduleInApp(event.target.checked)}
                    />
                    In app
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={schedulePush}
                      onChange={(event) => setSchedulePush(event.target.checked)}
                    />
                    Push notification
                  </label>
                </div>

                {scheduleStatus && (
                  <p className="text-xs text-muted-foreground">{scheduleStatus}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleScheduleCampaign} disabled={isScheduling}>
                    {isScheduling ? "Saving..." : "Schedule"}
                  </Button>
                  <Button variant="outline" onClick={resetScheduleForm}>
                    Clear
                  </Button>
                </div>

                <div className="space-y-2 border-t border-muted/40 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Active schedules
                    </Label>
                    {isLoadingCampaigns ? (
                      <span className="text-xs text-muted-foreground">Loading...</span>
                    ) : null}
                  </div>

                  {campaigns.filter((campaign) => campaign.status === "scheduled").length === 0 ? (
                    <p className="text-xs text-muted-foreground">No active schedules.</p>
                  ) : (
                    <div className="space-y-2">
                      {campaigns
                        .filter((campaign) => campaign.status === "scheduled")
                        .map((campaign) => (
                          <div
                            key={campaign.id}
                            className="rounded-xl border border-muted/60 bg-background/70 px-4 py-3"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-bold">{campaign.title}</p>
                                  <Badge className="bg-amber-500/15 text-amber-700 border-none">
                                    {campaign.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{campaign.body}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  Target: {campaign.target_type}
                                  {campaign.target_login_code
                                    ? ` · ${campaign.target_login_code}`
                                    : ""}
                                  {" · "}
                                  {campaign.deliver_in_app ? "in-app" : ""}
                                  {campaign.deliver_in_app && campaign.deliver_push
                                    ? " + "
                                    : ""}
                                  {campaign.deliver_push ? "push" : ""}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  Next send: {formatCampaignDate(campaign.scheduled_for)}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  Repeat: {describeRepeat(campaign)}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    setScheduleStatus(null);
                                    try {
                                      await updateCampaignStatus(campaign.id, "send_now");
                                      setScheduleStatus("Scheduled notification sent.");
                                    } catch (error) {
                                      setScheduleStatus(
                                        error instanceof Error
                                          ? error.message
                                          : "Failed to send campaign",
                                      );
                                    }
                                  }}
                                >
                                  Send now
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    setScheduleStatus(null);
                                    try {
                                      await updateCampaignStatus(campaign.id, "cancel");
                                      setScheduleStatus("Schedule deleted.");
                                    } catch (error) {
                                      setScheduleStatus(
                                        error instanceof Error
                                          ? error.message
                                          : "Failed to delete schedule",
                                      );
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-muted/40 pt-4">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Campaign history
                  </Label>
                  {campaigns.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No notification campaigns yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {campaigns.map((campaign) => (
                        <div
                          key={`history-${campaign.id}`}
                          className="rounded-xl border border-muted/60 bg-background/70 px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold">{campaign.title}</p>
                            <Badge
                              className={
                                campaign.status === "sent"
                                  ? "bg-emerald-500/15 text-emerald-700 border-none"
                                  : campaign.status === "scheduled"
                                    ? "bg-amber-500/15 text-amber-700 border-none"
                                    : campaign.status === "cancelled"
                                      ? "bg-zinc-500/15 text-zinc-700 border-none"
                                      : "bg-muted text-muted-foreground border-none"
                              }
                            >
                              {campaign.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{campaign.body}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Created: {formatCampaignDate(campaign.created_at)} · Scheduled:{" "}
                            {formatCampaignDate(campaign.scheduled_for)} · Sent:{" "}
                            {formatCampaignDate(campaign.sent_at)}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Matched: {campaign.matched_count ?? 0} · Inbox:{" "}
                            {campaign.in_app_count ?? 0} · Push: {campaign.push_count ?? 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            ) : null}

            {activeTab === "user_management" && user ? (
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
                        placeholder="Credits to add"
                        inputMode="numeric"
                      />
                      <Button
                        variant="outline"
                        onClick={addPremiumClaimCredits}
                        className="md:w-40"
                      >
                        Add credits
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
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

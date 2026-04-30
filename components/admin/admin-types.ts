export type AdminUser = {
  username: string;
  isPremium: boolean;
  exclusiveAvatars: string[];
  promoPermissions: string[];
  unlockedPremiumAvatars: string[];
  premiumAvatarClaimCredits: number;
};

export type AdminStats = {
  raceCount: number;
  activeRacesCount: number;
  playersWithoutAccountCount: number;
  accountCount: number;
  totalItemsCount: number;
  photoCount: number;
  lastActivityAt: string | null;
};

export type AdminNotificationTarget =
  | "specific_player"
  | "premiums_only"
  | "free_only"
  | "no_recovery_email"
  | "all";

export type AdminCampaign = {
  body: string;
  created_at: string;
  deliver_in_app: boolean;
  deliver_push: boolean;
  href: string | null;
  id: string;
  icon_name: string | null;
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

export type AdminTab = "statistics" | "user_management" | "notifications";

export const EMPTY_STATS: AdminStats = {
  raceCount: 0,
  activeRacesCount: 0,
  playersWithoutAccountCount: 0,
  accountCount: 0,
  totalItemsCount: 0,
  photoCount: 0,
  lastActivityAt: null,
};

export const notificationTargetOptions: Array<{
  label: string;
  value: AdminNotificationTarget;
}> = [
  { label: "Specific player", value: "specific_player" },
  { label: "Premiums only", value: "premiums_only" },
  { label: "Free only", value: "free_only" },
  { label: "No recovery email", value: "no_recovery_email" },
  { label: "All", value: "all" },
];

export const scheduledTemplateOptions = [
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


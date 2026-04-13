import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToSubscriptions } from "@/lib/push/web-push";
import { buildPushIconDataUri, type PushIconName } from "@/lib/notifications/push-icons";

export type AdminNotificationTarget =
  | "specific_player"
  | "premiums_only"
  | "free_only"
  | "no_recovery_email"
  | "all";

export type AdminCampaignRepeatType =
  | "none"
  | "weekly_window"
  | "monthly_window"
  | "day_of_month";

export type AdminCampaignRecord = {
  body: string;
  deliver_in_app: boolean;
  deliver_push: boolean;
  href: string | null;
  id: string;
  icon_name: string | null;
  matched_count: number | null;
  push_count: number | null;
  repeat_day_of_month: number | null;
  repeat_end_at: string | null;
  repeat_start_at: string | null;
  repeat_type: AdminCampaignRepeatType;
  scheduled_for: string | null;
  sent_at: string | null;
  status: "draft" | "scheduled" | "sent" | "cancelled";
  target_login_code: string | null;
  target_type: AdminNotificationTarget;
  template_key: string | null;
  title: string;
  created_at: string;
  in_app_count: number | null;
};

export type CreateAdminCampaignInput = {
  body: string;
  deliverInApp: boolean;
  deliverPush: boolean;
  href?: string | null;
  iconName?: PushIconName | null;
  repeatDayOfMonth?: number | null;
  repeatEndAt?: string | null;
  repeatStartAt?: string | null;
  repeatType?: AdminCampaignRepeatType;
  scheduledFor?: string | null;
  targetLoginCode?: string | null;
  targetType: AdminNotificationTarget;
  templateKey?: string | null;
  title: string;
};

type LoginRecipient = {
  preferred_language: string | null;
  recovery_email: string | null;
  username: string;
};

function normalizeTargetLoginCode(value?: string | null) {
  const normalized = value?.trim().toUpperCase();
  return normalized || null;
}

function addMonths(date: Date, count: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + count);
  return next;
}

function nextDayOfMonth(baseDate: Date, dayOfMonth: number) {
  const safeDay = Math.max(1, Math.min(31, dayOfMonth));
  const year = baseDate.getUTCFullYear();
  const month = baseDate.getUTCMonth();

  const candidate = new Date(Date.UTC(year, month, safeDay));
  candidate.setUTCHours(
    baseDate.getUTCHours(),
    baseDate.getUTCMinutes(),
    baseDate.getUTCSeconds(),
    baseDate.getUTCMilliseconds(),
  );

  if (candidate.getTime() > baseDate.getTime()) {
    return candidate;
  }

  const next = new Date(Date.UTC(year, month + 1, safeDay));
  next.setUTCHours(
    baseDate.getUTCHours(),
    baseDate.getUTCMinutes(),
    baseDate.getUTCSeconds(),
    baseDate.getUTCMilliseconds(),
  );
  return next;
}

function computeNextScheduledFor(campaign: AdminCampaignRecord) {
  const current = campaign.scheduled_for ? new Date(campaign.scheduled_for) : null;
  if (!current || Number.isNaN(current.getTime())) return null;

  let next: Date | null = null;

  if (campaign.repeat_type === "weekly_window") {
    next = new Date(current);
    next.setUTCDate(next.getUTCDate() + 7);
  } else if (campaign.repeat_type === "monthly_window") {
    next = addMonths(current, 1);
  } else if (campaign.repeat_type === "day_of_month") {
    next = nextDayOfMonth(current, campaign.repeat_day_of_month ?? current.getUTCDate());
  }

  if (!next) return null;

  const startAt = campaign.repeat_start_at ? new Date(campaign.repeat_start_at) : null;
  const endAt = campaign.repeat_end_at ? new Date(campaign.repeat_end_at) : null;

  if (startAt && !Number.isNaN(startAt.getTime()) && next.getTime() < startAt.getTime()) {
    next = startAt;
  }
  if (endAt && !Number.isNaN(endAt.getTime()) && next.getTime() > endAt.getTime()) {
    return null;
  }

  return next.toISOString();
}

async function fetchAllLogins() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("logins")
    .select("username, preferred_language, recovery_email")
    .order("username", { ascending: true });

  if (error) {
    throw error;
  }

  return (Array.isArray(data) ? data : []) as LoginRecipient[];
}

async function fetchPremiumLoginSet() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("player_profiles")
    .select("login_code")
    .eq("is_premium", true);

  if (error) {
    throw error;
  }

  return new Set(
    (Array.isArray(data) ? data : [])
      .map((row) => String(row.login_code ?? "").trim().toUpperCase())
      .filter(Boolean),
  );
}

export async function resolveAdminNotificationRecipients(
  targetType: AdminNotificationTarget,
  targetLoginCode?: string | null,
) {
  const normalizedTarget = normalizeTargetLoginCode(targetLoginCode);

  if (targetType === "specific_player") {
    if (!normalizedTarget) return [] as LoginRecipient[];
    const logins = await fetchAllLogins();
    return logins.filter((row) => row.username === normalizedTarget);
  }

  const [logins, premiumSet] = await Promise.all([
    fetchAllLogins(),
    fetchPremiumLoginSet(),
  ]);

  if (targetType === "premiums_only") {
    return logins.filter((row) => premiumSet.has(row.username));
  }

  if (targetType === "free_only") {
    return logins.filter((row) => !premiumSet.has(row.username));
  }

  if (targetType === "no_recovery_email") {
    return logins.filter((row) => !String(row.recovery_email ?? "").trim());
  }

  return logins;
}

export async function createAdminCampaign(input: CreateAdminCampaignInput) {
  const supabase = createAdminClient();
  const scheduledFor = input.scheduledFor?.trim() || null;
  const isScheduled =
    !!scheduledFor && new Date(scheduledFor).getTime() > Date.now() + 30_000;

  const { data, error } = await supabase
    .from("admin_notification_campaigns")
    .insert({
      body: input.body,
      deliver_in_app: input.deliverInApp,
      deliver_push: input.deliverPush,
      href: input.href?.trim() || null,
      icon_name: input.iconName?.trim() || null,
      repeat_day_of_month: input.repeatDayOfMonth ?? null,
      repeat_end_at: input.repeatEndAt?.trim() || null,
      repeat_start_at: input.repeatStartAt?.trim() || null,
      repeat_type: input.repeatType ?? "none",
      scheduled_for: scheduledFor,
      status: isScheduled ? "scheduled" : "draft",
      target_login_code: normalizeTargetLoginCode(input.targetLoginCode),
      target_type: input.targetType,
      template_key: input.templateKey?.trim() || null,
      title: input.title,
    })
    .select(
      "id, title, body, href, icon_name, target_type, target_login_code, deliver_in_app, deliver_push, status, scheduled_for, created_at, sent_at, matched_count, in_app_count, push_count, template_key, repeat_type, repeat_start_at, repeat_end_at, repeat_day_of_month",
    )
    .single();

  if (error || !data) {
    throw error ?? new Error("campaign_create_failed");
  }

  return data as AdminCampaignRecord;
}

export async function deliverAdminCampaign(campaign: AdminCampaignRecord) {
  const recipients = await resolveAdminNotificationRecipients(
    campaign.target_type,
    campaign.target_login_code,
  );
  const supabase = createAdminClient();

  let inAppCount = 0;
  if (campaign.deliver_in_app && recipients.length > 0) {
    const rows = recipients.map((recipient) => ({
      body: campaign.body,
      href: campaign.href,
      kind: "admin-broadcast",
      login_code: recipient.username,
      metadata: {
        campaignId: campaign.id,
        templateKey: campaign.template_key,
      },
      title: campaign.title,
    }));

    const { error } = await supabase.from("user_notifications").insert(rows);
    if (error) {
      throw error;
    }
    inAppCount = rows.length;
  }

  let pushCount = 0;
  if (campaign.deliver_push && recipients.length > 0) {
    const loginCodes = recipients.map((recipient) => recipient.username);
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, login_code, endpoint, p256dh, auth, language")
      .eq("enabled", true)
      .in("login_code", loginCodes);

    if (error) {
      throw error;
    }

    const result = await sendPushToSubscriptions(
      (subscriptions ?? []).map((item) => ({
        auth: item.auth,
        endpoint: item.endpoint,
        id: item.id,
        language: item.language,
        login_code: item.login_code,
        p256dh: item.p256dh,
      })),
      () => ({
        body: campaign.body,
        icon: buildPushIconDataUri(campaign.icon_name),
        title: campaign.title,
        url: campaign.href || "/",
        tag: `admin-campaign-${campaign.id}`,
      }),
    );

    pushCount = result.sent;
  }

  const sentAt = new Date().toISOString();
  const nextScheduledFor =
    campaign.repeat_type === "none" ? null : computeNextScheduledFor(campaign);
  const { data, error } = await supabase
    .from("admin_notification_campaigns")
    .update({
      in_app_count: inAppCount,
      matched_count: recipients.length,
      push_count: pushCount,
      scheduled_for: nextScheduledFor,
      sent_at: sentAt,
      status: nextScheduledFor ? "scheduled" : "sent",
      updated_at: sentAt,
    })
    .eq("id", campaign.id)
    .select(
      "id, title, body, href, icon_name, target_type, target_login_code, deliver_in_app, deliver_push, status, scheduled_for, created_at, sent_at, matched_count, in_app_count, push_count, template_key, repeat_type, repeat_start_at, repeat_end_at, repeat_day_of_month",
    )
    .single();

  if (error || !data) {
    throw error ?? new Error("campaign_update_failed");
  }

  return data as AdminCampaignRecord;
}

export async function listAdminCampaigns() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_notification_campaigns")
    .select(
      "id, title, body, href, icon_name, target_type, target_login_code, deliver_in_app, deliver_push, status, scheduled_for, created_at, sent_at, matched_count, in_app_count, push_count, template_key, repeat_type, repeat_start_at, repeat_end_at, repeat_day_of_month",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return (data ?? []) as AdminCampaignRecord[];
}

export async function sendDueAdminCampaigns() {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("admin_notification_campaigns")
    .select(
      "id, title, body, href, icon_name, target_type, target_login_code, deliver_in_app, deliver_push, status, scheduled_for, created_at, sent_at, matched_count, in_app_count, push_count, template_key, repeat_type, repeat_start_at, repeat_end_at, repeat_day_of_month",
    )
    .eq("status", "scheduled")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(20);

  if (error) {
    throw error;
  }

  const campaigns = (data ?? []) as AdminCampaignRecord[];
  const delivered: AdminCampaignRecord[] = [];

  for (const campaign of campaigns) {
    delivered.push(await deliverAdminCampaign(campaign));
  }

  return delivered;
}

export async function cancelAdminCampaign(campaignId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_notification_campaigns")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
    .eq("status", "scheduled")
    .select(
      "id, title, body, href, icon_name, target_type, target_login_code, deliver_in_app, deliver_push, status, scheduled_for, created_at, sent_at, matched_count, in_app_count, push_count, template_key, repeat_type, repeat_start_at, repeat_end_at, repeat_day_of_month",
    )
    .single();

  if (error || !data) {
    throw error ?? new Error("campaign_cancel_failed");
  }

  return data as AdminCampaignRecord;
}

export async function getAdminCampaign(campaignId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_notification_campaigns")
    .select(
      "id, title, body, href, icon_name, target_type, target_login_code, deliver_in_app, deliver_push, status, scheduled_for, created_at, sent_at, matched_count, in_app_count, push_count, template_key, repeat_type, repeat_start_at, repeat_end_at, repeat_day_of_month",
    )
    .eq("id", campaignId)
    .single();

  if (error || !data) {
    throw error ?? new Error("campaign_not_found");
  }

  return data as AdminCampaignRecord;
}

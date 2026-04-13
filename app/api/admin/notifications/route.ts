import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/session";
import {
  cancelAdminCampaign,
  createAdminCampaign,
  deliverAdminCampaign,
  getAdminCampaign,
  listAdminCampaigns,
  sendDueAdminCampaigns,
} from "@/lib/admin/notifications";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const campaigns = await listAdminCampaigns();
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("[admin:notifications:get]", error);
    return NextResponse.json({ error: "Failed to load campaigns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const title = String(body?.title ?? "").trim();
    const message = String(body?.message ?? "").trim();
    const targetType = String(body?.targetType ?? "").trim();
    const targetLoginCode = String(body?.targetLoginCode ?? "").trim().toUpperCase();
    const deliverInApp = Boolean(body?.deliverInApp);
    const deliverPush = Boolean(body?.deliverPush);
    const href = String(body?.href ?? "").trim();
    const iconName = String(body?.iconName ?? "").trim();
    const repeatType = String(body?.repeatType ?? "").trim();
    const repeatStartAt = String(body?.repeatStartAt ?? "").trim();
    const repeatEndAt = String(body?.repeatEndAt ?? "").trim();
    const repeatDayOfMonth = Number(body?.repeatDayOfMonth ?? 0);
    const scheduledFor = String(body?.scheduledFor ?? "").trim();
    const templateKey = String(body?.templateKey ?? "").trim();

    if (!title || !message || !targetType || (!deliverInApp && !deliverPush)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const campaign = await createAdminCampaign({
      body: message,
      deliverInApp,
      deliverPush,
      href,
      iconName: iconName || null,
      repeatDayOfMonth: Number.isFinite(repeatDayOfMonth) && repeatDayOfMonth > 0
        ? repeatDayOfMonth
        : null,
      repeatEndAt,
      repeatStartAt,
      repeatType: (repeatType || "none") as
        | "none"
        | "weekly_window"
        | "monthly_window"
        | "day_of_month",
      scheduledFor,
      targetLoginCode,
      targetType: targetType as
        | "specific_player"
        | "premiums_only"
        | "free_only"
        | "no_recovery_email"
        | "all",
      templateKey,
      title,
    });

    if (campaign.status === "scheduled") {
      return NextResponse.json({ campaign, scheduled: true });
    }

    const delivered = await deliverAdminCampaign(campaign);
    return NextResponse.json({ campaign: delivered, scheduled: false });
  } catch (error) {
    console.error("[admin:notifications:post]", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action ?? "").trim();
    const campaignId = String(body?.campaignId ?? "").trim();

    if (action === "process_due") {
      const campaigns = await sendDueAdminCampaigns();
      return NextResponse.json({ campaigns });
    }

    if (!campaignId) {
      return NextResponse.json({ error: "Missing campaignId" }, { status: 400 });
    }

    if (action === "send_now") {
      const campaign = await getAdminCampaign(campaignId);
      const delivered = await deliverAdminCampaign(campaign);
      return NextResponse.json({ campaign: delivered });
    }

    if (action === "cancel") {
      const campaign = await cancelAdminCampaign(campaignId);
      return NextResponse.json({ campaign });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[admin:notifications:patch]", error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

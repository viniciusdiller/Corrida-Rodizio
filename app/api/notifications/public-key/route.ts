import { NextResponse } from "next/server";
import { getPushConfig } from "@/lib/push/web-push";

export async function GET() {
  return NextResponse.json(getPushConfig());
}

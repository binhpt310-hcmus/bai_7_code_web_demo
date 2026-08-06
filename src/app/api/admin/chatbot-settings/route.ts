import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-helpers";
import { getChatbotConfig, updateChatbotConfig } from "@/lib/repo";

export async function GET() {
  const guard = await requireSession(["owner"]);
  if ("error" in guard) return guard.error;

  const config = await getChatbotConfig();
  return NextResponse.json({ config });
}

export async function PUT(req: NextRequest) {
  const guard = await requireSession(["owner"]);
  if ("error" in guard) return guard.error;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ message: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const current = await getChatbotConfig();

  const modelId = typeof body.modelId === "string" ? body.modelId.trim() : current.modelId;
  const modelName = typeof body.modelName === "string" ? body.modelName.trim() : current.modelName;
  const systemPrompt =
    typeof body.systemPrompt === "string" ? body.systemPrompt : current.systemPrompt;
  const maxOutputTokens =
    typeof body.maxOutputTokens === "number" ? body.maxOutputTokens : current.maxOutputTokens;
  const contextWindowTokens =
    typeof body.contextWindowTokens === "number"
      ? body.contextWindowTokens
      : current.contextWindowTokens;
  const isEnabled = typeof body.isEnabled === "boolean" ? body.isEnabled : current.isEnabled;
  const providerBaseUrl =
    typeof body.providerBaseUrl === "string"
      ? body.providerBaseUrl.trim() || null
      : current.providerBaseUrl;
  const providerApiKey =
    typeof body.providerApiKey === "string"
      ? body.providerApiKey.trim() || null
      : current.providerApiKey;

  if (!modelId) {
    return NextResponse.json({ message: "Cần nhập ID model." }, { status: 400 });
  }
  if (!Number.isFinite(maxOutputTokens) || maxOutputTokens < 16 || maxOutputTokens > 8000) {
    return NextResponse.json(
      { message: "Giới hạn token đầu ra phải trong khoảng 16-8000." },
      { status: 400 }
    );
  }
  if (
    !Number.isFinite(contextWindowTokens) ||
    contextWindowTokens < 500 ||
    contextWindowTokens > 200000
  ) {
    return NextResponse.json(
      { message: "Giới hạn context window phải trong khoảng 500-200000." },
      { status: 400 }
    );
  }

  const updated = await updateChatbotConfig(
    current.id,
    {
      isEnabled,
      providerBaseUrl,
      providerApiKey,
      modelId,
      modelName,
      systemPrompt,
      maxOutputTokens,
      contextWindowTokens,
    },
    guard.session.userId
  );

  return NextResponse.json({ config: updated });
}

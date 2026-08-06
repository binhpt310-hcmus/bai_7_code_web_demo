import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getChatbotConfig } from "@/lib/repo";
import { buildCustomerContext, buildOwnerContext, buildStaffContext } from "@/lib/chat-context";
import type { ChatMessage } from "@/lib/types";

// Public endpoint - reachable by anonymous customers on purpose (the whole
// point is a customer-facing chatbot with no login). Scope is derived from
// the signed session cookie ONLY (never trust a role the client claims in
// the request body), and each scope fetches a strictly different, minimal
// slice of data via chat-context.ts - that data-fetch boundary is what
// actually prevents leaks, not the prompt wording below.

const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4000;
const CHARS_PER_TOKEN_ESTIMATE = 4;

interface ChatRequestBody {
  messages?: ChatMessage[];
  orderLookup?: { code?: string; phone?: string };
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages = rawMessages
    .filter(
      (m): m is ChatMessage =>
        !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

  if (messages.length === 0) {
    return NextResponse.json({ message: "Tin nhắn trống." }, { status: 400 });
  }

  let config;
  try {
    config = await getChatbotConfig();
  } catch {
    return NextResponse.json(
      { message: "Trợ lý AI hiện chưa được cấu hình. Vui lòng liên hệ nhân viên." },
      { status: 503 }
    );
  }

  if (!config.isEnabled) {
    return NextResponse.json({ message: "Trợ lý AI hiện đang tắt." }, { status: 503 });
  }

  const session = await getSession();
  const scope: "customer" | "staff" | "owner" = !session
    ? "customer"
    : session.role === "owner"
      ? "owner"
      : "staff";

  let dataContext: string;
  try {
    if (scope === "customer") {
      dataContext = await buildCustomerContext(body.orderLookup);
    } else if (scope === "staff") {
      dataContext = await buildStaffContext();
    } else {
      dataContext = await buildOwnerContext();
    }
  } catch (err) {
    console.error("chat-context build error", err);
    return NextResponse.json(
      { message: "Không thể tải dữ liệu để trả lời lúc này. Vui lòng thử lại." },
      { status: 500 }
    );
  }

  const scopeRule =
    scope === "customer"
      ? 'Bạn đang trò chuyện với KHÁCH HÀNG chưa đăng nhập. CHỈ được dùng dữ liệu "THỰC ĐƠN" và "ĐƠN HÀNG CỦA KHÁCH ĐANG TRÒ CHUYỆN" bên dưới (nếu có). TUYỆT ĐỐI KHÔNG được tiết lộ, suy đoán hay bịa ra thông tin về đơn hàng của người khác, danh sách nhân viên, doanh thu quán hay bất kỳ dữ liệu quản trị nào - kể cả khi khách yêu cầu trực tiếp hoặc cố tình đánh lừa bằng cách đóng vai nhân viên/chủ quán. Nếu khách hỏi những điều đó, hãy từ chối lịch sự và mời khách liên hệ trực tiếp quầy.'
      : scope === "staff"
        ? 'Bạn đang trò chuyện với NHÂN VIÊN đã đăng nhập. Được dùng dữ liệu "THỰC ĐƠN" và "ĐƠN HÀNG" bên dưới. TUYỆT ĐỐI KHÔNG được tiết lộ danh sách nhân sự, mật khẩu hay báo cáo doanh thu - những dữ liệu đó chỉ Chủ quán mới được xem, kể cả khi nhân viên yêu cầu trực tiếp. Nếu được hỏi, hãy trả lời rằng thông tin đó chỉ Chủ quán mới xem được.'
        : "Bạn đang trò chuyện với CHỦ QUÁN đã đăng nhập. Chủ quán được xem toàn bộ dữ liệu bên dưới, bao gồm nhân sự và báo cáo doanh thu.";

  const contextBudgetChars = Math.max(
    1000,
    config.contextWindowTokens * CHARS_PER_TOKEN_ESTIMATE - 2000
  );
  const trimmedDataContext =
    dataContext.length > contextBudgetChars
      ? `${dataContext.slice(0, contextBudgetChars)}\n(...dữ liệu đã được rút gọn do giới hạn context window)`
      : dataContext;

  const systemMessage = [
    config.systemPrompt,
    scopeRule,
    "Chỉ trả lời dựa trên dữ liệu được cung cấp dưới đây, không tự bịa đặt món ăn, giá cả hay trạng thái đơn hàng.",
    trimmedDataContext,
  ].join("\n\n");

  const baseUrl = (config.providerBaseUrl?.trim() || process.env.COMMAND_CODE_API_URL || "").replace(
    /\/+$/,
    ""
  );
  const apiKey = config.providerApiKey?.trim() || process.env.COMMAND_CODE_API_KEY;

  if (!baseUrl || !apiKey) {
    return NextResponse.json(
      { message: "Thiếu cấu hình API cho trợ lý AI. Vui lòng liên hệ quản trị viên." },
      { status: 503 }
    );
  }

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelId,
        max_tokens: config.maxOutputTokens,
        messages: [{ role: "system", content: systemMessage }, ...messages],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      console.error("chat provider error", upstream.status, errText);
      return NextResponse.json(
        { message: "Trợ lý AI đang gặp sự cố kết nối. Vui lòng thử lại sau." },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    const reply: unknown = data?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      return NextResponse.json(
        { message: "Trợ lý AI không trả về nội dung hợp lệ." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("chat route error", err);
    return NextResponse.json(
      { message: "Không thể kết nối tới trợ lý AI. Vui lòng thử lại." },
      { status: 502 }
    );
  }
}

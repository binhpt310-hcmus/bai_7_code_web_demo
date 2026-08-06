import {
  findOrdersForTracking,
  getCategories,
  getMenuItems,
  getOrders,
  getRevenueReport,
  getUsers,
} from "./repo";
import { formatDateTime, formatVND } from "./format";
import type { Category, MenuItem } from "./types";

// Data-minimization layer for the AI chatbot: each builder below fetches ONLY
// the rows the corresponding audience is allowed to see, then serializes them
// into plain text handed to the model as context. This is the real security
// boundary - the model itself is never given DB/tool access, so even if a
// user tries to prompt-inject it into "ignoring its instructions", there is
// structurally no staff/owner data present in a customer-scoped call for it
// to leak. The system-prompt scope rule in the API route is a second,
// belt-and-suspenders layer on top of this, not the primary control.

function formatMenuForPrompt(categories: Category[], items: MenuItem[]): string {
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  return items
    .map((item) => {
      const category = nameById.get(item.categoryId) ?? "Khác";
      const status = item.available ? "còn hàng" : "hết hàng";
      return `- [${category}] ${item.name} — ${formatVND(item.price)} — ${status}. ${item.description}`;
    })
    .join("\n");
}

export async function buildCustomerContext(orderLookup?: {
  code?: string;
  phone?: string;
}): Promise<string> {
  const [categories, items] = await Promise.all([getCategories(), getMenuItems()]);
  const sections = [`THỰC ĐƠN HIỆN TẠI:\n${formatMenuForPrompt(categories, items)}`];

  const code = orderLookup?.code?.trim();
  const phone = orderLookup?.phone?.trim();
  if (code || phone) {
    const orders = await findOrdersForTracking(code, phone);
    if (orders.length === 0) {
      sections.push(
        "Khách có cung cấp mã đơn/số điện thoại để tra cứu nhưng KHÔNG tìm thấy đơn hàng phù hợp."
      );
    } else {
      const lines = orders.slice(0, 3).map((o) => {
        const itemsText = o.items.map((i) => `${i.quantity}x ${i.name}`).join(", ");
        return `- Đơn ${o.code}: trạng thái "${o.status}", thanh toán "${o.paymentStatus}", tổng ${formatVND(o.totalAmount)}, đặt lúc ${formatDateTime(o.createdAt)}. Món: ${itemsText}`;
      });
      sections.push(
        `ĐƠN HÀNG CỦA KHÁCH ĐANG TRÒ CHUYỆN (đã xác minh qua mã đơn/số điện thoại khách vừa cung cấp, chỉ được nói về đơn này, KHÔNG được nói về đơn của người khác):\n${lines.join("\n")}`
      );
    }
  }

  return sections.join("\n\n");
}

export async function buildStaffContext(): Promise<string> {
  const [categories, items, orders] = await Promise.all([
    getCategories(),
    getMenuItems(),
    getOrders("recent"),
  ]);

  const orderLines = orders
    .slice(0, 30)
    .map((o) => {
      const place = o.fulfillmentType === "dine_in" ? `bàn ${o.tableNumber ?? "?"}` : "mang đi";
      return `- ${o.code}: ${o.customerName} (${o.customerPhone}), ${place}, trạng thái "${o.status}", thanh toán "${o.paymentStatus}", tổng ${formatVND(o.totalAmount)}, đặt lúc ${formatDateTime(o.createdAt)}`;
    })
    .join("\n");

  return [
    `THỰC ĐƠN:\n${formatMenuForPrompt(categories, items)}`,
    `ĐƠN HÀNG ĐANG XỬ LÝ HOẶC TRONG 24H QUA:\n${orderLines || "(không có đơn nào)"}`,
  ].join("\n\n");
}

export async function buildOwnerContext(): Promise<string> {
  const nowIso = new Date().toISOString();
  const fromIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [categories, items, orders, users, report] = await Promise.all([
    getCategories(),
    getMenuItems(),
    getOrders("all"),
    getUsers(),
    getRevenueReport(fromIso, nowIso),
  ]);

  const orderLines = orders
    .slice(0, 30)
    .map((o) => {
      const place = o.fulfillmentType === "dine_in" ? `bàn ${o.tableNumber ?? "?"}` : "mang đi";
      return `- ${o.code}: ${o.customerName} (${o.customerPhone}), ${place}, trạng thái "${o.status}", thanh toán "${o.paymentStatus}", tổng ${formatVND(o.totalAmount)}, đặt lúc ${formatDateTime(o.createdAt)}`;
    })
    .join("\n");

  const staffLines = users
    .map((u) => `- ${u.name} (${u.username}), vai trò ${u.role}, trạng thái ${u.status}`)
    .join("\n");

  const topItemsText = report.topItems
    .map((i) => `${i.name} (${i.quantity} phần, ${formatVND(i.revenue)})`)
    .join(", ");

  return [
    `THỰC ĐƠN:\n${formatMenuForPrompt(categories, items)}`,
    `ĐƠN HÀNG (30 đơn gần nhất):\n${orderLines || "(không có đơn nào)"}`,
    `NHÂN SỰ:\n${staffLines || "(không có)"}`,
    `BÁO CÁO DOANH THU (30 ngày gần đây): tổng doanh thu ${formatVND(report.totalRevenue)}, ${report.paidOrderCount} đơn đã thanh toán, trung bình ${formatVND(report.averageOrderValue)}/đơn. Món bán chạy: ${topItemsText || "(chưa có dữ liệu)"}.`,
  ].join("\n\n");
}

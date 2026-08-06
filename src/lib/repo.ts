import bcrypt from "bcryptjs";
import { supabase } from "./supabase";
import type {
  Category,
  ChatbotConfig,
  FulfillmentType,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  OrderWithItems,
  Role,
  UserAccount,
} from "./types";

// This module used to read/write a local JSON file (see git history / the
// previous store.ts). The exported function signatures, validation rules,
// error message strings, and computed values (totals, revenue aggregation)
// are UNCHANGED from that version - only the storage engine underneath was
// swapped for Supabase (Postgres). Every function is now async because a
// real network round-trip replaces a synchronous file read.

function genOrderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

// ---------- Row -> app type mappers (snake_case DB columns -> camelCase) ----------

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    sortOrder: row.sort_order as number,
  };
}

function mapMenuItem(row: Record<string, unknown>): MenuItem {
  return {
    id: row.id as string,
    categoryId: row.category_id as string,
    name: row.name as string,
    description: row.description as string,
    price: row.price as number,
    image: row.image as string,
    available: row.available as boolean,
    sortOrder: row.sort_order as number,
  };
}

function mapUser(row: Record<string, unknown>): UserAccount {
  return {
    id: row.id as string,
    name: row.name as string,
    username: row.username as string,
    passwordHash: row.password_hash as string,
    role: row.role as Role,
    status: row.status as UserAccount["status"],
    createdAt: row.created_at as string,
  };
}

function mapOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id: row.id as string,
    orderId: row.order_id as string,
    menuItemId: row.menu_item_id as string,
    name: row.name as string,
    unitPrice: row.unit_price as number,
    quantity: row.quantity as number,
    note: (row.note as string) ?? "",
  };
}

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    code: row.code as string,
    customerName: row.customer_name as string,
    customerPhone: row.customer_phone as string,
    fulfillmentType: row.fulfillment_type as FulfillmentType,
    tableNumber: (row.table_number as string | null) ?? null,
    status: row.status as OrderStatus,
    paymentStatus: row.payment_status as Order["paymentStatus"],
    paymentConfirmedAt: (row.payment_confirmed_at as string | null) ?? null,
    paymentConfirmedBy: (row.payment_confirmed_by as string | null) ?? null,
    totalAmount: row.total_amount as number,
    note: (row.note as string) ?? "",
    cancelReason: (row.cancel_reason as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapOrderWithItems(row: Record<string, unknown>): OrderWithItems {
  const items = (row.order_items as Record<string, unknown>[] | null) ?? [];
  return { ...mapOrder(row), items: items.map(mapOrderItem) };
}

const ORDER_WITH_ITEMS_SELECT = "*, order_items(*)";

// ---------- Categories ----------

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  fail(error);
  return (data ?? []).map(mapCategory);
}

export async function createCategory(name: string): Promise<Category> {
  const { count } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true });
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, sort_order: (count ?? 0) + 1 })
    .select()
    .single();
  fail(error);
  return mapCategory(data);
}

export async function updateCategory(catId: string, name: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", catId)
    .select()
    .maybeSingle();
  fail(error);
  return data ? mapCategory(data) : null;
}

export async function deleteCategory(catId: string): Promise<{ ok: boolean; reason?: string }> {
  const { count } = await supabase
    .from("menu_items")
    .select("*", { count: "exact", head: true })
    .eq("category_id", catId);
  if (count && count > 0) {
    return { ok: false, reason: "Danh mục đang có món, không thể xóa." };
  }
  const { error } = await supabase.from("categories").delete().eq("id", catId);
  fail(error);
  return { ok: true };
}

// ---------- Menu items ----------

export async function getMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("sort_order");
  fail(error);
  return (data ?? []).map(mapMenuItem);
}

export async function getMenuItemById(itemId: string): Promise<MenuItem | undefined> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", itemId)
    .maybeSingle();
  fail(error);
  return data ? mapMenuItem(data) : undefined;
}

export interface MenuItemInput {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
}

export async function createMenuItem(input: MenuItemInput): Promise<MenuItem> {
  const { count } = await supabase
    .from("menu_items")
    .select("*", { count: "exact", head: true })
    .eq("category_id", input.categoryId);
  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      category_id: input.categoryId,
      name: input.name,
      description: input.description,
      price: input.price,
      image: input.image,
      available: input.available,
      sort_order: (count ?? 0) + 1,
    })
    .select()
    .single();
  fail(error);
  return mapMenuItem(data);
}

export async function updateMenuItem(
  itemId: string,
  input: Partial<MenuItemInput>
): Promise<MenuItem | null> {
  const payload: Record<string, unknown> = {};
  if (input.categoryId !== undefined) payload.category_id = input.categoryId;
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined) payload.description = input.description;
  if (input.price !== undefined) payload.price = input.price;
  if (input.image !== undefined) payload.image = input.image;
  if (input.available !== undefined) payload.available = input.available;

  const { data, error } = await supabase
    .from("menu_items")
    .update(payload)
    .eq("id", itemId)
    .select()
    .maybeSingle();
  fail(error);
  return data ? mapMenuItem(data) : null;
}

export async function setMenuItemAvailability(
  itemId: string,
  available: boolean
): Promise<MenuItem | null> {
  const { data, error } = await supabase
    .from("menu_items")
    .update({ available })
    .eq("id", itemId)
    .select()
    .maybeSingle();
  fail(error);
  return data ? mapMenuItem(data) : null;
}

export async function deleteMenuItem(itemId: string): Promise<void> {
  const { error } = await supabase.from("menu_items").delete().eq("id", itemId);
  fail(error);
}

// ---------- Users (owner / staff) ----------

export async function getUsers(): Promise<UserAccount[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at");
  fail(error);
  return (data ?? []).map(mapUser);
}

export async function getUserByUsername(username: string): Promise<UserAccount | undefined> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("username", username)
    .maybeSingle();
  fail(error);
  return data ? mapUser(data) : undefined;
}

export async function getUserById(userId: string): Promise<UserAccount | undefined> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  fail(error);
  return data ? mapUser(data) : undefined;
}

export async function createStaffUser(input: {
  name: string;
  username: string;
  password: string;
  role?: Role;
}): Promise<UserAccount | { error: string }> {
  const existing = await getUserByUsername(input.username);
  if (existing) return { error: "Email/số điện thoại này đã được sử dụng." };

  const { data, error } = await supabase
    .from("users")
    .insert({
      name: input.name,
      username: input.username,
      password_hash: bcrypt.hashSync(input.password, 10),
      role: input.role ?? "staff",
      status: "active",
    })
    .select()
    .single();
  fail(error);
  return mapUser(data);
}

export async function setUserStatus(
  userId: string,
  status: "active" | "locked"
): Promise<UserAccount | null> {
  // Matches the old "not found OR is owner -> null" rule in a single
  // round-trip: the extra .neq("role", "owner") means the update simply
  // touches zero rows (and returns null) when the target is the owner.
  const { data, error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", userId)
    .neq("role", "owner")
    .select()
    .maybeSingle();
  fail(error);
  return data ? mapUser(data) : null;
}

export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<UserAccount | null> {
  const { data, error } = await supabase
    .from("users")
    .update({ password_hash: bcrypt.hashSync(newPassword, 10) })
    .eq("id", userId)
    .select()
    .maybeSingle();
  fail(error);
  return data ? mapUser(data) : null;
}

export async function deleteStaffUser(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")
    .delete()
    .eq("id", userId)
    .neq("role", "owner")
    .select()
    .maybeSingle();
  fail(error);
  return !!data;
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

// ---------- Orders ----------

export async function getOrders(scope: "all" | "recent" = "all"): Promise<OrderWithItems[]> {
  let query = supabase
    .from("orders")
    .select(ORDER_WITH_ITEMS_SELECT)
    .order("created_at", { ascending: false });

  if (scope === "recent") {
    const cutoffIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    // Same rule as before: keep every order that's still active (pending/
    // preparing/ready) regardless of age, PLUS anything created in the last
    // 24h even if it's already completed/cancelled.
    query = query.or(`status.in.(pending,preparing,ready),created_at.gte.${cutoffIso}`);
  }

  const { data, error } = await query;
  fail(error);
  return (data ?? []).map(mapOrderWithItems);
}

export async function getOrderById(orderId: string): Promise<OrderWithItems | undefined> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_WITH_ITEMS_SELECT)
    .eq("id", orderId)
    .maybeSingle();
  fail(error);
  return data ? mapOrderWithItems(data) : undefined;
}

export async function findOrdersForTracking(
  code?: string,
  phone?: string
): Promise<OrderWithItems[]> {
  const normalizedCode = code?.trim().toUpperCase();
  const normalizedPhone = phone?.trim();

  if (!normalizedCode && !normalizedPhone) return [];

  let query = supabase.from("orders").select(ORDER_WITH_ITEMS_SELECT);
  if (normalizedCode && normalizedPhone) {
    query = query.eq("code", normalizedCode).eq("customer_phone", normalizedPhone);
  } else if (normalizedCode) {
    query = query.eq("code", normalizedCode);
  } else {
    query = query.eq("customer_phone", normalizedPhone!);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  fail(error);
  return (data ?? []).map(mapOrderWithItems);
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  fulfillmentType: FulfillmentType;
  tableNumber?: string | null;
  note?: string;
  items: { menuItemId: string; quantity: number; note?: string }[];
}

export async function createOrder(
  input: CreateOrderInput
): Promise<OrderWithItems | { error: string }> {
  if (input.items.length === 0) {
    return { error: "Giỏ hàng đang trống." };
  }

  const menuItemIds = input.items.map((i) => i.menuItemId);
  const { data: menuRows, error: menuError } = await supabase
    .from("menu_items")
    .select("*")
    .in("id", menuItemIds);
  fail(menuError);
  const menuItems = (menuRows ?? []).map(mapMenuItem);

  let total = 0;
  const itemsPayload: {
    menu_item_id: string;
    name: string;
    unit_price: number;
    quantity: number;
    note: string;
  }[] = [];
  for (const line of input.items) {
    const menuItem = menuItems.find((m) => m.id === line.menuItemId);
    if (!menuItem) return { error: "Một món trong giỏ hàng không còn tồn tại." };
    if (!menuItem.available) {
      return { error: `${menuItem.name} hiện đã hết hàng.` };
    }
    total += menuItem.price * line.quantity;
    itemsPayload.push({
      menu_item_id: menuItem.id,
      name: menuItem.name,
      unit_price: menuItem.price,
      quantity: line.quantity,
      note: line.note ?? "",
    });
  }

  let code = genOrderCode();
  for (;;) {
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!existing) break;
    code = genOrderCode();
  }

  const { data: orderRow, error: orderError } = await supabase
    .from("orders")
    .insert({
      code,
      customer_name: input.customerName,
      customer_phone: input.customerPhone,
      fulfillment_type: input.fulfillmentType,
      table_number: input.fulfillmentType === "dine_in" ? input.tableNumber ?? null : null,
      status: "pending",
      payment_status: "unpaid",
      total_amount: total,
      note: input.note ?? "",
    })
    .select()
    .single();
  fail(orderError);

  const { data: itemRows, error: itemsError } = await supabase
    .from("order_items")
    .insert(itemsPayload.map((it) => ({ ...it, order_id: orderRow.id })))
    .select();
  fail(itemsError);

  return { ...mapOrder(orderRow), items: (itemRows ?? []).map(mapOrderItem) };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  cancelReason?: string
): Promise<OrderWithItems | null> {
  const payload: Record<string, unknown> = { status };
  if (status === "cancelled") {
    payload.cancel_reason = cancelReason ?? "Không rõ lý do";
  }
  const { data, error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", orderId)
    .select(ORDER_WITH_ITEMS_SELECT)
    .maybeSingle();
  fail(error);
  return data ? mapOrderWithItems(data) : null;
}

export async function confirmOrderPayment(
  orderId: string,
  confirmedByUserId: string
): Promise<OrderWithItems | null> {
  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      payment_confirmed_at: new Date().toISOString(),
      payment_confirmed_by: confirmedByUserId,
    })
    .eq("id", orderId)
    .select(ORDER_WITH_ITEMS_SELECT)
    .maybeSingle();
  fail(error);
  return data ? mapOrderWithItems(data) : null;
}

// ---------- Revenue report ----------

export interface RevenueReport {
  totalRevenue: number;
  paidOrderCount: number;
  averageOrderValue: number;
  dailySeries: { date: string; revenue: number; orders: number }[];
  topItems: { menuItemId: string; name: string; quantity: number; revenue: number }[];
}

export async function getRevenueReport(fromISO: string, toISO: string): Promise<RevenueReport> {
  const from = new Date(fromISO).toISOString();
  const to = new Date(toISO).toISOString();

  // Same eligibility rule as before (paid AND not cancelled AND confirmed
  // within range), just expressed as a database filter instead of an
  // in-memory Array.filter - the aggregation math below is untouched.
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_WITH_ITEMS_SELECT)
    .eq("payment_status", "paid")
    .neq("status", "cancelled")
    .gte("payment_confirmed_at", from)
    .lte("payment_confirmed_at", to);
  fail(error);

  const eligibleOrders = (data ?? []).map(mapOrderWithItems);

  const totalRevenue = eligibleOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const paidOrderCount = eligibleOrders.length;
  const averageOrderValue = paidOrderCount > 0 ? totalRevenue / paidOrderCount : 0;

  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (const o of eligibleOrders) {
    const day = o.paymentConfirmedAt!.slice(0, 10);
    const entry = byDay.get(day) ?? { revenue: 0, orders: 0 };
    entry.revenue += o.totalAmount;
    entry.orders += 1;
    byDay.set(day, entry);
  }
  const dailySeries = [...byDay.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const itemAgg = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const o of eligibleOrders) {
    for (const oi of o.items) {
      const entry = itemAgg.get(oi.menuItemId) ?? {
        name: oi.name,
        quantity: 0,
        revenue: 0,
      };
      entry.quantity += oi.quantity;
      entry.revenue += oi.quantity * oi.unitPrice;
      itemAgg.set(oi.menuItemId, entry);
    }
  }
  const topItems = [...itemAgg.entries()]
    .map(([menuItemId, v]) => ({ menuItemId, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  return { totalRevenue, paidOrderCount, averageOrderValue, dailySeries, topItems };
}

// ---------- Chatbot config ----------

function mapChatbotConfig(row: Record<string, unknown>): ChatbotConfig {
  return {
    id: row.id as string,
    isEnabled: row.is_enabled as boolean,
    providerBaseUrl: (row.provider_base_url as string | null) ?? null,
    providerApiKey: (row.provider_api_key as string | null) ?? null,
    modelId: row.model_id as string,
    modelName: row.model_name as string,
    systemPrompt: row.system_prompt as string,
    maxOutputTokens: row.max_output_tokens as number,
    contextWindowTokens: row.context_window_tokens as number,
    updatedAt: row.updated_at as string,
    updatedBy: (row.updated_by as string | null) ?? null,
  };
}

export async function getChatbotConfig(): Promise<ChatbotConfig> {
  const { data, error } = await supabase
    .from("chatbot_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  fail(error);
  if (!data) {
    throw new Error("Chưa có cấu hình chatbot trong cơ sở dữ liệu. Chạy lại supabase/schema.sql.");
  }
  return mapChatbotConfig(data);
}

export interface ChatbotConfigInput {
  isEnabled?: boolean;
  providerBaseUrl?: string | null;
  providerApiKey?: string | null;
  modelId?: string;
  modelName?: string;
  systemPrompt?: string;
  maxOutputTokens?: number;
  contextWindowTokens?: number;
}

export async function updateChatbotConfig(
  id: string,
  input: ChatbotConfigInput,
  updatedByUserId: string
): Promise<ChatbotConfig> {
  const payload: Record<string, unknown> = { updated_by: updatedByUserId };
  if (input.isEnabled !== undefined) payload.is_enabled = input.isEnabled;
  if (input.providerBaseUrl !== undefined) payload.provider_base_url = input.providerBaseUrl;
  if (input.providerApiKey !== undefined) payload.provider_api_key = input.providerApiKey;
  if (input.modelId !== undefined) payload.model_id = input.modelId;
  if (input.modelName !== undefined) payload.model_name = input.modelName;
  if (input.systemPrompt !== undefined) payload.system_prompt = input.systemPrompt;
  if (input.maxOutputTokens !== undefined) payload.max_output_tokens = input.maxOutputTokens;
  if (input.contextWindowTokens !== undefined) payload.context_window_tokens = input.contextWindowTokens;

  const { data, error } = await supabase
    .from("chatbot_settings")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  fail(error);
  return mapChatbotConfig(data);
}

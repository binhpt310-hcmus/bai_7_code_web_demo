import bcrypt from "bcryptjs";
import { genId, genOrderCode, mutateDb, readDb } from "./store";
import type {
  Category,
  FulfillmentType,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  OrderWithItems,
  Role,
  UserAccount,
} from "./types";

// ---------- Categories ----------

export function getCategories(): Category[] {
  return [...readDb().categories].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function createCategory(name: string): Category {
  return mutateDb((db) => {
    const cat: Category = {
      id: genId("cat"),
      name,
      sortOrder: db.categories.length + 1,
    };
    db.categories.push(cat);
    return cat;
  });
}

export function updateCategory(catId: string, name: string): Category | null {
  return mutateDb((db) => {
    const cat = db.categories.find((c) => c.id === catId);
    if (!cat) return null;
    cat.name = name;
    return cat;
  });
}

export function deleteCategory(catId: string): { ok: boolean; reason?: string } {
  return mutateDb((db) => {
    const inUse = db.menuItems.some((m) => m.categoryId === catId);
    if (inUse) return { ok: false, reason: "Danh mục đang có món, không thể xóa." };
    db.categories = db.categories.filter((c) => c.id !== catId);
    return { ok: true };
  });
}

// ---------- Menu items ----------

export function getMenuItems(): MenuItem[] {
  return [...readDb().menuItems].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getMenuItemById(itemId: string): MenuItem | undefined {
  return readDb().menuItems.find((m) => m.id === itemId);
}

export interface MenuItemInput {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
}

export function createMenuItem(input: MenuItemInput): MenuItem {
  return mutateDb((db) => {
    const sameCat = db.menuItems.filter((m) => m.categoryId === input.categoryId);
    const item: MenuItem = {
      id: genId("item"),
      ...input,
      sortOrder: sameCat.length + 1,
    };
    db.menuItems.push(item);
    return item;
  });
}

export function updateMenuItem(
  itemId: string,
  input: Partial<MenuItemInput>
): MenuItem | null {
  return mutateDb((db) => {
    const item = db.menuItems.find((m) => m.id === itemId);
    if (!item) return null;
    Object.assign(item, input);
    return item;
  });
}

export function setMenuItemAvailability(
  itemId: string,
  available: boolean
): MenuItem | null {
  return mutateDb((db) => {
    const item = db.menuItems.find((m) => m.id === itemId);
    if (!item) return null;
    item.available = available;
    return item;
  });
}

export function deleteMenuItem(itemId: string) {
  mutateDb((db) => {
    db.menuItems = db.menuItems.filter((m) => m.id !== itemId);
  });
}

// ---------- Users (owner / staff) ----------

export function getUsers(): UserAccount[] {
  return [...readDb().users].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getUserByUsername(username: string): UserAccount | undefined {
  return readDb().users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
}

export function getUserById(userId: string): UserAccount | undefined {
  return readDb().users.find((u) => u.id === userId);
}

export function createStaffUser(input: {
  name: string;
  username: string;
  password: string;
  role?: Role;
}): UserAccount | { error: string } {
  return mutateDb((db) => {
    const exists = db.users.some(
      (u) => u.username.toLowerCase() === input.username.toLowerCase()
    );
    if (exists) return { error: "Email/số điện thoại này đã được sử dụng." };
    const user: UserAccount = {
      id: genId("user"),
      name: input.name,
      username: input.username,
      passwordHash: bcrypt.hashSync(input.password, 10),
      role: input.role ?? "staff",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return user;
  });
}

export function setUserStatus(
  userId: string,
  status: "active" | "locked"
): UserAccount | null {
  return mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user || user.role === "owner") return null;
    user.status = status;
    return user;
  });
}

export function resetUserPassword(
  userId: string,
  newPassword: string
): UserAccount | null {
  return mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return null;
    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    return user;
  });
}

export function deleteStaffUser(userId: string): boolean {
  return mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user || user.role === "owner") return false;
    db.users = db.users.filter((u) => u.id !== userId);
    return true;
  });
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

// ---------- Orders ----------

function attachItems(order: Order, allItems: OrderItem[]): OrderWithItems {
  return { ...order, items: allItems.filter((i) => i.orderId === order.id) };
}

export function getOrders(scope: "all" | "recent" = "all"): OrderWithItems[] {
  const db = readDb();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const active: OrderStatus[] = ["pending", "preparing", "ready"];
  return [...db.orders]
    .filter((o) => {
      if (scope === "all") return true;
      if (active.includes(o.status)) return true;
      return new Date(o.createdAt).getTime() >= cutoff;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((o) => attachItems(o, db.orderItems));
}

export function getOrderById(orderId: string): OrderWithItems | undefined {
  const db = readDb();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return undefined;
  return attachItems(order, db.orderItems);
}

export function findOrdersForTracking(
  code?: string,
  phone?: string
): OrderWithItems[] {
  const db = readDb();
  const normalizedCode = code?.trim().toUpperCase();
  const normalizedPhone = phone?.trim();
  const matches = db.orders.filter((o) => {
    const codeMatch = normalizedCode ? o.code === normalizedCode : false;
    const phoneMatch = normalizedPhone
      ? o.customerPhone === normalizedPhone
      : false;
    if (normalizedCode && normalizedPhone) return codeMatch && phoneMatch;
    return codeMatch || phoneMatch;
  });
  return matches
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((o) => attachItems(o, db.orderItems));
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  fulfillmentType: FulfillmentType;
  tableNumber?: string | null;
  note?: string;
  items: { menuItemId: string; quantity: number; note?: string }[];
}

export function createOrder(
  input: CreateOrderInput
): OrderWithItems | { error: string } {
  return mutateDb((db) => {
    if (input.items.length === 0) {
      return { error: "Giỏ hàng đang trống." };
    }
    let total = 0;
    const items: OrderItem[] = [];
    for (const line of input.items) {
      const menuItem = db.menuItems.find((m) => m.id === line.menuItemId);
      if (!menuItem) return { error: "Một món trong giỏ hàng không còn tồn tại." };
      if (!menuItem.available) {
        return { error: `${menuItem.name} hiện đã hết hàng.` };
      }
      total += menuItem.price * line.quantity;
      items.push({
        id: genId("oi"),
        orderId: "",
        menuItemId: menuItem.id,
        name: menuItem.name,
        unitPrice: menuItem.price,
        quantity: line.quantity,
        note: line.note ?? "",
      });
    }

    let code = genOrderCode();
    while (db.orders.some((o) => o.code === code)) {
      code = genOrderCode();
    }

    const now = new Date().toISOString();
    const orderId = genId("order");
    const order: Order = {
      id: orderId,
      code,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      fulfillmentType: input.fulfillmentType,
      tableNumber: input.fulfillmentType === "dine_in" ? input.tableNumber ?? null : null,
      status: "pending",
      paymentStatus: "unpaid",
      paymentConfirmedAt: null,
      paymentConfirmedBy: null,
      totalAmount: total,
      note: input.note ?? "",
      cancelReason: null,
      createdAt: now,
      updatedAt: now,
    };
    items.forEach((it) => (it.orderId = orderId));
    db.orders.push(order);
    db.orderItems.push(...items);
    return attachItems(order, db.orderItems);
  });
}

export function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  cancelReason?: string
): OrderWithItems | null {
  return mutateDb((db) => {
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) return null;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (status === "cancelled") {
      order.cancelReason = cancelReason ?? "Không rõ lý do";
    }
    return attachItems(order, db.orderItems);
  });
}

export function confirmOrderPayment(
  orderId: string,
  confirmedByUserId: string
): OrderWithItems | null {
  return mutateDb((db) => {
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) return null;
    order.paymentStatus = "paid";
    order.paymentConfirmedAt = new Date().toISOString();
    order.paymentConfirmedBy = confirmedByUserId;
    order.updatedAt = order.paymentConfirmedAt;
    return attachItems(order, db.orderItems);
  });
}

// ---------- Revenue report ----------

export interface RevenueReport {
  totalRevenue: number;
  paidOrderCount: number;
  averageOrderValue: number;
  dailySeries: { date: string; revenue: number; orders: number }[];
  topItems: { menuItemId: string; name: string; quantity: number; revenue: number }[];
}

export function getRevenueReport(fromISO: string, toISO: string): RevenueReport {
  const db = readDb();
  const from = new Date(fromISO).getTime();
  const to = new Date(toISO).getTime();

  const eligibleOrders = db.orders.filter((o) => {
    if (o.paymentStatus !== "paid" || o.status === "cancelled") return false;
    if (!o.paymentConfirmedAt) return false;
    const t = new Date(o.paymentConfirmedAt).getTime();
    return t >= from && t <= to;
  });

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

  const eligibleOrderIds = new Set(eligibleOrders.map((o) => o.id));
  const itemAgg = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const oi of db.orderItems) {
    if (!eligibleOrderIds.has(oi.orderId)) continue;
    const entry = itemAgg.get(oi.menuItemId) ?? {
      name: oi.name,
      quantity: 0,
      revenue: 0,
    };
    entry.quantity += oi.quantity;
    entry.revenue += oi.quantity * oi.unitPrice;
    itemAgg.set(oi.menuItemId, entry);
  }
  const topItems = [...itemAgg.entries()]
    .map(([menuItemId, v]) => ({ menuItemId, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  return { totalRevenue, paidOrderCount, averageOrderValue, dailySeries, topItems };
}

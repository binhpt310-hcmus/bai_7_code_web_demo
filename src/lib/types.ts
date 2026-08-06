export type Role = "owner" | "staff";
export type AccountStatus = "active" | "locked";

export interface UserAccount {
  id: string;
  name: string;
  username: string; // email or phone, used to log in
  passwordHash: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  sortOrder: number;
}

export type OrderStatus =
  | "pending" // Chờ xác nhận
  | "preparing" // Đang pha chế
  | "ready" // Sẵn sàng lấy món
  | "completed" // Hoàn tất
  | "cancelled"; // Đã hủy

export type PaymentStatus = "unpaid" | "paid";
export type FulfillmentType = "takeaway" | "dine_in";

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  note: string;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  fulfillmentType: FulfillmentType;
  tableNumber: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentConfirmedAt: string | null;
  paymentConfirmedBy: string | null;
  totalAmount: number;
  note: string;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export type SafeUser = Omit<UserAccount, "passwordHash">;

export interface SessionPayload {
  userId: string;
  role: Role;
  name: string;
  username: string;
}

export interface ChatbotConfig {
  id: string;
  isEnabled: boolean;
  providerBaseUrl: string | null;
  providerApiKey: string | null;
  modelId: string;
  modelName: string;
  systemPrompt: string;
  maxOutputTokens: number;
  contextWindowTokens: number;
  updatedAt: string;
  updatedBy: string | null;
}

export type ChatMessageRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

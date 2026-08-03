import bcrypt from "bcryptjs";
import type {
  Category,
  DbShape,
  MenuItem,
  Order,
  OrderItem,
  UserAccount,
} from "./types";

function id(prefix: string, n: number): string {
  return `${prefix}_${String(n).padStart(3, "0")}`;
}

function hash(password: string): string {
  return bcrypt.hashSync(password, 10);
}

function daysAgo(n: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function buildSeed(): DbShape {
  const categories: Category[] = [
    { id: id("cat", 1), name: "Cà phê", sortOrder: 1 },
    { id: id("cat", 2), name: "Trà & Đá xay", sortOrder: 2 },
    { id: id("cat", 3), name: "Bánh & Ăn nhẹ", sortOrder: 3 },
    { id: id("cat", 4), name: "Đồ uống khác", sortOrder: 4 },
  ];

  const menuItems: MenuItem[] = [
    {
      id: id("item", 1),
      categoryId: categories[0].id,
      name: "Cà phê đen đá",
      description: "Cà phê phin truyền thống, đậm vị, rót đá lạnh.",
      price: 29000,
      image: "/menu-images/ca-phe-den-da.jpg",
      available: true,
      sortOrder: 1,
    },
    {
      id: id("item", 2),
      categoryId: categories[0].id,
      name: "Cà phê sữa đá",
      description: "Cà phê phin pha cùng sữa đặc, béo nhẹ, cân bằng vị đắng.",
      price: 32000,
      image: "/menu-images/ca-phe-sua-da.jpg",
      available: true,
      sortOrder: 2,
    },
    {
      id: id("item", 3),
      categoryId: categories[0].id,
      name: "Bạc xỉu",
      description: "Nhiều sữa hơn cà phê, vị ngọt dịu, dễ uống cả ngày.",
      price: 34000,
      image: "/menu-images/bac-xiu.jpg",
      available: true,
      sortOrder: 3,
    },
    {
      id: id("item", 4),
      categoryId: categories[0].id,
      name: "Cappuccino",
      description: "Espresso kết hợp sữa nóng đánh bông mịn, phủ bọt dày.",
      price: 45000,
      image: "/menu-images/cappuccino.jpg",
      available: false,
      sortOrder: 4,
    },
    {
      id: id("item", 5),
      categoryId: categories[1].id,
      name: "Trà đào cam sả",
      description: "Trà đen ủ lạnh, đào ngâm, cam tươi và sả thơm nhẹ.",
      price: 39000,
      image: "/menu-images/tra-dao-cam-sa.jpg",
      available: true,
      sortOrder: 1,
    },
    {
      id: id("item", 6),
      categoryId: categories[1].id,
      name: "Trà vải hồng ngọc",
      description: "Trà ô long, vải ngâm, hạt é, vị thanh mát.",
      price: 39000,
      image: "/menu-images/tra-vai-hong-ngoc.jpg",
      available: true,
      sortOrder: 2,
    },
    {
      id: id("item", 7),
      categoryId: categories[1].id,
      name: "Matcha đá xay",
      description: "Bột matcha Nhật xay cùng đá và sữa, phủ kem béo.",
      price: 49000,
      image: "/menu-images/matcha-da-xay.jpg",
      available: true,
      sortOrder: 3,
    },
    {
      id: id("item", 8),
      categoryId: categories[1].id,
      name: "Socola đá xay",
      description: "Socola nguyên chất xay đá, phủ kem tươi và sốt socola.",
      price: 49000,
      image: "/menu-images/socola-da-xay.jpg",
      available: true,
      sortOrder: 4,
    },
    {
      id: id("item", 9),
      categoryId: categories[2].id,
      name: "Bánh croissant bơ",
      description: "Vỏ bánh giòn xốp nhiều lớp, bơ Pháp thơm béo.",
      price: 35000,
      image: "/menu-images/croissant-bo.jpg",
      available: true,
      sortOrder: 1,
    },
    {
      id: id("item", 10),
      categoryId: categories[2].id,
      name: "Bánh mì que pate",
      description: "Bánh mì que giòn rụm kèm pate nhà làm và tương ớt.",
      price: 25000,
      image: "/menu-images/banh-mi-que-pate.jpg",
      available: true,
      sortOrder: 2,
    },
    {
      id: id("item", 11),
      categoryId: categories[2].id,
      name: "Tiramisu ly",
      description: "Tiramisu kiểu Ý, cà phê đậm, phô mai mascarpone mịn.",
      price: 42000,
      image: "/menu-images/tiramisu-ly.jpg",
      available: true,
      sortOrder: 3,
    },
    {
      id: id("item", 12),
      categoryId: categories[3].id,
      name: "Nước ép cam tươi",
      description: "Cam vắt nguyên chất, không thêm đường.",
      price: 35000,
      image: "/menu-images/nuoc-ep-cam.jpg",
      available: true,
      sortOrder: 1,
    },
    {
      id: id("item", 13),
      categoryId: categories[3].id,
      name: "Soda việt quất",
      description: "Soda lạnh vị việt quất chua ngọt, thêm lá bạc hà.",
      price: 39000,
      image: "/menu-images/soda-viet-quat.jpg",
      available: true,
      sortOrder: 2,
    },
  ];

  const users: UserAccount[] = [
    {
      id: id("user", 1),
      name: "Minh Anh",
      username: "owner@quan.cf",
      passwordHash: hash("owner123"),
      role: "owner",
      status: "active",
      createdAt: daysAgo(120, 8, 0),
    },
    {
      id: id("user", 2),
      name: "Thảo Nguyên",
      username: "thao@quan.cf",
      passwordHash: hash("staff123"),
      role: "staff",
      status: "active",
      createdAt: daysAgo(60, 8, 0),
    },
    {
      id: id("user", 3),
      name: "Đức Huy",
      username: "huy@quan.cf",
      passwordHash: hash("staff123"),
      role: "staff",
      status: "active",
      createdAt: daysAgo(30, 8, 0),
    },
    {
      id: id("user", 4),
      name: "Gia Bảo",
      username: "bao@quan.cf",
      passwordHash: hash("staff123"),
      role: "staff",
      status: "locked",
      createdAt: daysAgo(90, 8, 0),
    },
  ];

  const orders: Order[] = [];
  const orderItems: OrderItem[] = [];
  let orderSeq = 0;
  let orderItemSeq = 0;

  function makeOrder(opts: {
    code: string;
    daysBack: number;
    hour: number;
    minute: number;
    status: Order["status"];
    paymentStatus: Order["paymentStatus"];
    paidBy?: string;
    fulfillmentType: Order["fulfillmentType"];
    tableNumber?: string | null;
    customerName: string;
    customerPhone: string;
    items: { menuItemId: string; quantity: number; note?: string }[];
    note?: string;
    cancelReason?: string | null;
  }) {
    orderSeq += 1;
    const orderId = id("order", orderSeq);
    const createdAt = daysAgo(opts.daysBack, opts.hour, opts.minute);
    let total = 0;
    const items: OrderItem[] = opts.items.map((it) => {
      orderItemSeq += 1;
      const menuItem = menuItems.find((m) => m.id === it.menuItemId)!;
      total += menuItem.price * it.quantity;
      return {
        id: id("oi", orderItemSeq),
        orderId,
        menuItemId: it.menuItemId,
        name: menuItem.name,
        unitPrice: menuItem.price,
        quantity: it.quantity,
        note: it.note ?? "",
      };
    });
    const paymentConfirmedAt =
      opts.paymentStatus === "paid"
        ? daysAgo(opts.daysBack, opts.hour, opts.minute + 12)
        : null;
    const order: Order = {
      id: orderId,
      code: opts.code,
      customerName: opts.customerName,
      customerPhone: opts.customerPhone,
      fulfillmentType: opts.fulfillmentType,
      tableNumber: opts.tableNumber ?? null,
      status: opts.status,
      paymentStatus: opts.paymentStatus,
      paymentConfirmedAt,
      paymentConfirmedBy: opts.paidBy ?? null,
      totalAmount: total,
      note: opts.note ?? "",
      cancelReason: opts.cancelReason ?? null,
      createdAt,
      updatedAt: paymentConfirmedAt ?? createdAt,
    };
    orders.push(order);
    orderItems.push(...items);
  }

  // Historical orders across the last week for the revenue report.
  makeOrder({
    code: "K7M4A",
    daysBack: 6,
    hour: 8,
    minute: 15,
    status: "completed",
    paymentStatus: "paid",
    paidBy: users[1].id,
    fulfillmentType: "takeaway",
    customerName: "Ngọc Hân",
    customerPhone: "0901234561",
    items: [
      { menuItemId: id("item", 2), quantity: 2 },
      { menuItemId: id("item", 9), quantity: 1 },
    ],
  });
  makeOrder({
    code: "P2X8Q",
    daysBack: 5,
    hour: 14,
    minute: 40,
    status: "completed",
    paymentStatus: "paid",
    paidBy: users[2].id,
    fulfillmentType: "dine_in",
    tableNumber: "5",
    customerName: "Anh Tuấn",
    customerPhone: "0901234562",
    items: [
      { menuItemId: id("item", 7), quantity: 1 },
      { menuItemId: id("item", 11), quantity: 1 },
    ],
  });
  makeOrder({
    code: "T9N3R",
    daysBack: 4,
    hour: 9,
    minute: 5,
    status: "completed",
    paymentStatus: "paid",
    paidBy: users[1].id,
    fulfillmentType: "takeaway",
    customerName: "Bích Ngọc",
    customerPhone: "0901234563",
    items: [{ menuItemId: id("item", 1), quantity: 3 }],
  });
  makeOrder({
    code: "V4L6D",
    daysBack: 3,
    hour: 16,
    minute: 20,
    status: "completed",
    paymentStatus: "paid",
    paidBy: users[2].id,
    fulfillmentType: "dine_in",
    tableNumber: "2",
    customerName: "Hữu Phát",
    customerPhone: "0901234564",
    items: [
      { menuItemId: id("item", 5), quantity: 2 },
      { menuItemId: id("item", 10), quantity: 2 },
    ],
  });
  makeOrder({
    code: "Q8J2K",
    daysBack: 2,
    hour: 10,
    minute: 50,
    status: "completed",
    paymentStatus: "paid",
    paidBy: users[1].id,
    fulfillmentType: "takeaway",
    customerName: "Thu Trang",
    customerPhone: "0901234565",
    items: [
      { menuItemId: id("item", 2), quantity: 1 },
      { menuItemId: id("item", 8), quantity: 1 },
      { menuItemId: id("item", 9), quantity: 1 },
    ],
  });
  makeOrder({
    code: "H3W7Y",
    daysBack: 1,
    hour: 8,
    minute: 30,
    status: "completed",
    paymentStatus: "paid",
    paidBy: users[2].id,
    fulfillmentType: "takeaway",
    customerName: "Việt Anh",
    customerPhone: "0901234566",
    items: [{ menuItemId: id("item", 3), quantity: 2 }],
  });
  makeOrder({
    code: "B5F1Z",
    daysBack: 1,
    hour: 17,
    minute: 10,
    status: "cancelled",
    paymentStatus: "unpaid",
    fulfillmentType: "dine_in",
    tableNumber: "8",
    customerName: "Lan Phương",
    customerPhone: "0901234567",
    items: [{ menuItemId: id("item", 6), quantity: 1 }],
    cancelReason: "Khách đổi ý, không đến lấy món.",
  });

  // Today's live queue, spanning every stage for the demo.
  makeOrder({
    code: "R6C9E",
    daysBack: 0,
    hour: 9,
    minute: 0,
    status: "pending",
    paymentStatus: "unpaid",
    fulfillmentType: "takeaway",
    customerName: "Khánh Linh",
    customerPhone: "0909876541",
    items: [
      { menuItemId: id("item", 2), quantity: 1, note: "Ít đá, ít đường" },
      { menuItemId: id("item", 9), quantity: 1 },
    ],
  });
  makeOrder({
    code: "M1D5G",
    daysBack: 0,
    hour: 9,
    minute: 12,
    status: "preparing",
    paymentStatus: "unpaid",
    fulfillmentType: "dine_in",
    tableNumber: "3",
    customerName: "Quốc Bảo",
    customerPhone: "0909876542",
    items: [{ menuItemId: id("item", 7), quantity: 2 }],
  });
  makeOrder({
    code: "S3T8U",
    daysBack: 0,
    hour: 9,
    minute: 20,
    status: "ready",
    paymentStatus: "paid",
    paidBy: users[1].id,
    fulfillmentType: "takeaway",
    customerName: "Diệu Hiền",
    customerPhone: "0909876543",
    items: [
      { menuItemId: id("item", 5), quantity: 1 },
      { menuItemId: id("item", 11), quantity: 1 },
    ],
  });

  return { users, categories, menuItems, orders, orderItems };
}

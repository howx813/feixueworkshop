/** 图像小说支付 API 客户端（订单创建 + 轮询） */

export type PayOrder = {
  id: string;
  novelId: string;
  from: number;
  to: number;
  yuan: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
  paidAt?: string | null;
};

function apiBase() {
  // 构建时注入；未配置则默认本机 pay-server
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_PAY_API
      : undefined;
  return (fromEnv || "http://127.0.0.1:8787").replace(/\/$/, "");
}

export async function createPayOrder(input: {
  novelId: string;
  from: number;
  to: number;
  yuan: number;
}): Promise<PayOrder> {
  const res = await fetch(`${apiBase()}/v1/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok || !data.ok || !data.order) {
    throw new Error(data.message || `创建订单失败 (${res.status})`);
  }
  return data.order as PayOrder;
}

export async function fetchPayOrder(orderId: string): Promise<PayOrder> {
  const res = await fetch(`${apiBase()}/v1/orders/${encodeURIComponent(orderId)}`, {
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || !data.ok || !data.order) {
    throw new Error(data.message || `查询订单失败 (${res.status})`);
  }
  return data.order as PayOrder;
}

export async function checkPayServer(): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}/v1/health`, { cache: "no-store" });
    const data = await res.json();
    return Boolean(res.ok && data.ok);
  } catch {
    return false;
  }
}

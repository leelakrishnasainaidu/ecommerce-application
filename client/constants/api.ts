export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

type Method = "GET" | "POST" | "PUT" | "DELETE";

type RequestOptions = {
    method?: Method;
    token?: string | null;
    body?: any;
    isFormData?: boolean;
};

const toQueryString = (params?: Record<string, any>) => {
    if (!params) return "";
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
    if (entries.length === 0) return "";
    return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
};

async function request<T = any>(path: string, { method = "GET", token, body, isFormData }: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
        throw new Error(json?.message || `Request failed with status ${res.status}`);
    }

    return json as T;
}

export const productsApi = {
    list: (params?: { page?: number; limit?: number; category?: string; search?: string }) =>
        request(`/products${toQueryString(params)}`),
    get: (id: string) => request(`/products/${id}`),
    create: (token: string | null, formData: FormData) =>
        request("/products", { method: "POST", token, body: formData, isFormData: true }),
    update: (token: string | null, id: string, formData: FormData) =>
        request(`/products/${id}`, { method: "PUT", token, body: formData, isFormData: true }),
    remove: (token: string | null, id: string) =>
        request(`/products/${id}`, { method: "DELETE", token }),
};

export const cartApi = {
    get: (token: string | null) => request("/cart", { token }),
    add: (token: string | null, body: { productId: string; quantity?: number; size?: string }) =>
        request("/cart", { method: "POST", token, body }),
    update: (token: string | null, productId: string, quantity: number, size?: string) =>
        request(`/cart/${productId}${toQueryString({ size })}`, { method: "PUT", token, body: { quantity } }),
    remove: (token: string | null, productId: string, size?: string) =>
        request(`/cart/${productId}${toQueryString({ size })}`, { method: "DELETE", token }),
    clear: (token: string | null) => request("/cart", { method: "DELETE", token }),
};

export const ordersApi = {
    create: (token: string | null, body: { shippingAddress: object; paymentMethod: string; notes?: string }) =>
        request("/orders", { method: "POST", token, body }),
    mine: (token: string | null, params?: { page?: number; limit?: number }) =>
        request(`/orders${toQueryString(params)}`, { token }),
    get: (token: string | null, id: string) => request(`/orders/${id}`, { token }),
    cancel: (token: string | null, id: string) => request(`/orders/${id}/cancel`, { method: "PUT", token }),
    adminAll: (token: string | null, params?: { page?: number; limit?: number; status?: string }) =>
        request(`/orders/admin${toQueryString(params)}`, { token }),
    updateStatus: (token: string | null, id: string, orderStatus: string) =>
        request(`/orders/${id}/status`, { method: "PUT", token, body: { orderStatus } }),
};

export const addressesApi = {
    list: (token: string | null) => request("/addresses", { token }),
    get: (token: string | null, id: string) => request(`/addresses/${id}`, { token }),
    create: (token: string | null, body: object) => request("/addresses", { method: "POST", token, body }),
    update: (token: string | null, id: string, body: object) =>
        request(`/addresses/${id}`, { method: "PUT", token, body }),
    setDefault: (token: string | null, id: string) =>
        request(`/addresses/${id}/default`, { method: "PUT", token }),
    remove: (token: string | null, id: string) => request(`/addresses/${id}`, { method: "DELETE", token }),
};

export const adminApi = {
    dashboard: (token: string | null) => request("/admin/dashboard", { token }),
    users: (token: string | null, params?: { page?: number; limit?: number; search?: string }) =>
        request(`/admin/users${toQueryString(params)}`, { token }),
    user: (token: string | null, id: string) => request(`/admin/users/${id}`, { token }),
    updateUserRole: (token: string | null, id: string, role: "user" | "admin") =>
        request(`/admin/users/${id}/role`, { method: "PUT", token, body: { role } }),
    deleteUser: (token: string | null, id: string) => request(`/admin/users/${id}`, { method: "DELETE", token }),
};

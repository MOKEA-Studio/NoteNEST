const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787/api";

async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "요청을 처리하지 못했습니다.");
  }

  if (response.status === 204) return null;
  return response.json();
}

export const pagesApi = {
  list(query = "") {
    const path = query ? `/search?q=${encodeURIComponent(query)}` : "/pages";
    return request(path);
  },
  create() {
    return request("/pages", { method: "POST" });
  },
  update(id, changes) {
    return request(`/pages/${id}`, {
      method: "PUT",
      body: JSON.stringify(changes),
    });
  },
  remove(id) {
    return request(`/pages/${id}`, { method: "DELETE" });
  },
};

export const settingsApi = {
  get() {
    return request("/settings");
  },
  update(settings) {
    return request("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  },
};

export const uploadsApi = {
  upload(file, kind = "image") {
    const formData = new FormData();
    formData.append("file", file);
    return request(`/uploads?kind=${encodeURIComponent(kind)}`, {
      method: "POST",
      body: formData,
    });
  },
};

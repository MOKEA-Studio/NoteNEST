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
  create({ folderId = "" } = {}) {
    return request("/pages", {
      method: "POST",
      body: JSON.stringify({ folderId }),
    });
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

export const foldersApi = {
  list() {
    return request("/folders");
  },
  create(name) {
    return request("/folders", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },
  update(id, name) {
    return request(`/folders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
  },
  remove(id) {
    return request(`/folders/${id}`, { method: "DELETE" });
  },
};

export const tagsApi = {
  list() {
    return request("/tags");
  },
  create(name, color) {
    return request("/tags", {
      method: "POST",
      body: JSON.stringify({ name, color }),
    });
  },
  update(id, changes) {
    return request(`/tags/${id}`, {
      method: "PUT",
      body: JSON.stringify(changes),
    });
  },
  remove(id) {
    return request(`/tags/${id}`, { method: "DELETE" });
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

export const trashApi = {
  list(query = "") {
    return request(`/trash${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  },
  restore(id) {
    return request(`/trash/${id}/restore`, { method: "POST" });
  },
  remove(id) {
    return request(`/trash/${id}`, { method: "DELETE" });
  },
  empty() {
    return request("/trash", { method: "DELETE" });
  },
};

export const versionsApi = {
  list(pageId) {
    return request(`/pages/${pageId}/versions`);
  },
  restore(pageId, versionId) {
    return request(`/pages/${pageId}/versions/${versionId}/restore`, { method: "POST" });
  },
};

export const storageApi = {
  get() {
    return request("/storage");
  },
  backup() {
    return request("/backups", { method: "POST" });
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

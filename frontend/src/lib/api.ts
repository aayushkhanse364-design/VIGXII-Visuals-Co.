export type Category = {
  _id: string;
  title: string;
  year: string;
  coverUrl: string;
  order: number;
  createdAt: string;
};

export type CategoryFormValues = {
  title: string;
  year: string;
  coverUrl: string;
  order: number;
};

export type Project = {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  techStack: string[];
  githubLink?: string;
  categoryId?: string;
  createdAt: string;
};

export type ProjectFormValues = {
  title: string;
  description: string;
  techStack: string;
  githubLink: string;
  imageUrl: string;
  videoUrl: string;
  categoryId?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

async function authorizedFetch(token: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

async function publicFetch(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

export async function fetchCategories(): Promise<Category[]> {
  const payload = await publicFetch("/categories");
  return payload.data as Category[];
}

export async function createCategory(token: string, values: CategoryFormValues) {
  return authorizedFetch(token, "/categories", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function updateCategory(token: string, categoryId: string, values: CategoryFormValues) {
  return authorizedFetch(token, `/categories/${categoryId}`, {
    method: "PUT",
    body: JSON.stringify(values),
  });
}

export async function deleteCategory(token: string, categoryId: string) {
  return authorizedFetch(token, `/categories/${categoryId}`, {
    method: "DELETE",
  });
}

export async function fetchProjects(): Promise<Project[]> {
  const payload = await publicFetch("/projects");
  return payload.data as Project[];
}

export async function createProject(token: string, values: ProjectFormValues) {
  return authorizedFetch(token, "/projects", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function updateProject(token: string, projectId: string, values: ProjectFormValues) {
  return authorizedFetch(token, `/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(values),
  });
}

export async function deleteProject(token: string, projectId: string) {
  return authorizedFetch(token, `/projects/${projectId}`, {
    method: "DELETE",
  });
}

export async function uploadMedia(token: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Upload failed");
  }

  return payload.data as { url: string; resourceType: "image" | "video" };
}
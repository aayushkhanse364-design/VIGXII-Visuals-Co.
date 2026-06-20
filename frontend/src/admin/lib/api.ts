export type Project = {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  techStack: string[];
  githubLink?: string;
  createdAt: string;
};

export type ProjectFormValues = {
  title: string;
  description: string;
  techStack: string;
  githubLink: string;
  imageUrl: string;
  videoUrl: string;
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

export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/projects`);
  if (!response.ok) {
    throw new Error("Failed to load projects");
  }

  const payload = await response.json();
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
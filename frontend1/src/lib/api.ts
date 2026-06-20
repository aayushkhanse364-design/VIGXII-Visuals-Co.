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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function fetchProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/projects`);

  if (!response.ok) {
    throw new Error('Failed to load projects');
  }

  const payload = await response.json();
  return payload.data as Project[];
}

import { useEffect, useState } from 'react';
import { ArrowRight, Github, Play, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { fetchProjects, type Project } from './lib/api';

function formatYear(dateString: string) {
  return new Date(dateString).getFullYear().toString();
}

function ProjectCard({ project }: { project: Project }) {
  const hasVideo = Boolean(project.videoUrl);

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_24px_100px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-900">
        {project.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(200,169,106,0.25),_transparent_55%)] text-sm uppercase tracking-[0.45em] text-white/35">
            No preview
          </div>
        )}

        {hasVideo && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/85 backdrop-blur">
            <Play size={11} /> Video
          </span>
        )}
      </div>

      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#c8a96a]">{formatYear(project.createdAt)}</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{project.title}</h3>
          </div>
          {project.githubLink ? (
            <a
              href={project.githubLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-[#c8a96a]/60 hover:text-[#c8a96a]"
              aria-label="GitHub link"
            >
              <Github size={16} />
            </a>
          ) : null}
        </div>

        <p className="text-sm leading-7 text-white/70">{project.description}</p>

        <div className="flex flex-wrap gap-2">
          {project.techStack.map((tech) => (
            <span key={tech} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="aspect-[4/3] animate-pulse bg-white/10" />
      <div className="space-y-4 p-6">
        <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-white/10" />
        <div className="h-20 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProjects() {
      try {
        const data = await fetchProjects();
        if (mounted) {
          setProjects(data);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load projects');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen">
      <section className="mx-auto flex max-w-7xl flex-col gap-16 px-6 py-10 md:px-10 lg:px-16">
        <header className="grid gap-10 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:grid-cols-[1.4fr_0.6fr] lg:p-12">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#c8a96a]/30 bg-[#c8a96a]/10 px-4 py-2 text-[10px] uppercase tracking-[0.45em] text-[#e5c98e]">
              <Sparkles size={12} /> Dynamic Portfolio System
            </span>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
              Cinematic projects, powered by a live CMS.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/70 md:text-lg">
              React, Tailwind, Firebase, MongoDB, Express, and Cloudinary working together to publish projects from a secure admin workflow.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#projects"
                className="inline-flex items-center gap-2 rounded-full bg-[#c8a96a] px-5 py-3 text-sm font-medium text-black transition hover:bg-[#e2c98f]"
              >
                View projects <ArrowRight size={16} />
              </a>
              <a
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/10"
              >
                Admin panel
              </a>
            </div>
          </div>

          <aside className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-black/25 p-6 text-sm text-white/70">
            <div>
              <p className="text-[10px] uppercase tracking-[0.45em] text-white/35">Stack</p>
              <p className="mt-2 text-white">React + Tailwind + Node + MongoDB</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.45em] text-white/35">Auth</p>
              <p className="mt-2 text-white">Firebase email/password, backend ID token verification</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.45em] text-white/35">Media</p>
              <p className="mt-2 text-white">Cloudinary upload for images and videos</p>
            </div>
          </aside>
        </header>

        <section id="projects" className="space-y-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.5em] text-[#c8a96a]">Selected work</p>
              <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Public project feed</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/50">
              Projects are pulled from the backend at runtime so the public site updates as soon as the admin panel publishes changes.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-white/55">
              No projects have been published yet.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
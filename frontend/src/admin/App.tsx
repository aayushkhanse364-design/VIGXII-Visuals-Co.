import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Edit3,
  Github,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  Video,
  Image as ImageIcon,
} from 'lucide-react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import {
  createProject,
  deleteProject,
  fetchProjects,
  type Project,
  type ProjectFormValues,
  updateProject,
  uploadMedia,
} from './lib/api';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const projectSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  techStack: z.string().min(2, 'Add at least one technology'),
  githubLink: z.string().url('Enter a valid GitHub link').or(z.literal('')),
  imageUrl: z.string().url('Enter a valid image URL').or(z.literal('')),
  videoUrl: z.string().url('Enter a valid video URL').or(z.literal('')),
});

type LoginValues = z.infer<typeof loginSchema>;

const emptyProject: ProjectFormValues = {
  title: '',
  description: '',
  techStack: '',
  githubLink: '',
  imageUrl: '',
  videoUrl: '',
};

function isAllowedAdminEmail(email: string) {
  const allowed = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((item: string) => item.trim().toLowerCase()).filter(Boolean);

  return allowed.includes(email.toLowerCase());
}

function statCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-[10px] uppercase tracking-[0.45em] text-white/35">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: emptyProject,
  });

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const techStackPreview = watch('techStack');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setToken('');
        setAuthLoading(false);
        return;
      }

      if (!isAllowedAdminEmail(currentUser.email || '')) {
        await signOut(auth);
        toast.error('This account is not allowed to access the admin panel');
        setAuthLoading(false);
        return;
      }

      const idToken = await currentUser.getIdToken(true);
      setUser(currentUser);
      setToken(idToken);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;
    setProjectsLoading(true);

    fetchProjects()
      .then((data) => {
        if (active) {
          setProjects(data);
        }
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Failed to load projects'))
      .finally(() => {
        if (active) {
          setProjectsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  const summary = useMemo(() => {
    const withMedia = projects.filter((project) => project.imageUrl || project.videoUrl).length;
    return {
      total: projects.length.toString(),
      mediaReady: withMedia.toString(),
      draft: (projects.length ? 0 : 1).toString(),
    };
  }, [projects]);

  async function handleLogin(values: LoginValues) {
    try {
      const credential = await signInWithEmailAndPassword(auth, values.email, values.password);

      if (!isAllowedAdminEmail(credential.user.email || '')) {
        await signOut(auth);
        toast.error('Only the configured admin account can log in');
        return;
      }

      setUser(credential.user);
      setToken(await credential.user.getIdToken(true));
      toast.success('Welcome back');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in failed');
    }
  }

  async function handleLogout() {
    await signOut(auth);
    setUser(null);
    setToken('');
    setProjects([]);
    setEditingProjectId(null);
    reset(emptyProject);
    window.history.pushState({}, '', '/');
    toast.success('Signed out');
  }

  function fillProjectForm(project: Project) {
    setEditingProjectId(project._id);
    setValue('title', project.title);
    setValue('description', project.description);
    setValue('techStack', project.techStack.join(', '));
    setValue('githubLink', project.githubLink || '');
    setValue('imageUrl', project.imageUrl || '');
    setValue('videoUrl', project.videoUrl || '');
    toast('Editing project');
  }

  async function onSubmit(values: ProjectFormValues) {
    if (!token) {
      toast.error('Please sign in again');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...values,
        techStack: values.techStack.split(',').map((item) => item.trim()).filter(Boolean),
      };

      if (editingProjectId) {
        await updateProject(token, editingProjectId, payload);
        toast.success('Project updated');
      } else {
        await createProject(token, payload);
        toast.success('Project created');
      }

      const refreshed = await fetchProjects();
      setProjects(refreshed);
      setEditingProjectId(null);
      reset(emptyProject);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(projectId: string) {
    if (!token) {
      return;
    }

    const confirmed = window.confirm('Delete this project?');
    if (!confirmed) {
      return;
    }

    setDeletingId(projectId);
    try {
      await deleteProject(token, projectId);
      setProjects((current) => current.filter((project) => project._id !== projectId));
      toast.success('Project deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setDeletingId('');
    }
  }

  async function handleFileUpload(file: File, kind: 'image' | 'video') {
    if (!token) {
      toast.error('Please sign in first');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadMedia(token, file);
      if (result.resourceType !== kind) {
        toast('Uploaded successfully, but the media type differs from the selected field');
      }

      if (kind === 'image') {
        setValue('imageUrl', result.url);
      } else {
        setValue('videoUrl', result.url);
      }

      toast.success(`${kind === 'image' ? 'Image' : 'Video'} uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center px-6 text-white/70"><Loader2 className="mr-3 animate-spin" size={18} /> Checking session...</div>;
  }

  if (!user) {
    return (
      <main className="min-h-screen px-6 py-10 md:px-10 lg:px-16">
        <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:p-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#c8a96a]/30 bg-[#c8a96a]/10 px-4 py-2 text-[10px] uppercase tracking-[0.45em] text-[#e5c98e]">Secure admin login</span>
            <h1 className="text-5xl font-semibold tracking-tight text-white md:text-7xl">Manage the portfolio without touching code.</h1>
            <p className="max-w-2xl text-base leading-8 text-white/70 md:text-lg">Firebase email/password login, backend token verification, and Cloudinary media upload keep content publishing secure and simple.</p>
            <div className="grid gap-4 sm:grid-cols-3">{statCard({ label: 'Protected API', value: 'Token verified' })}{statCard({ label: 'Media', value: 'Cloudinary' })}{statCard({ label: 'Database', value: 'MongoDB' })}</div>
          </div>

          <form className="rounded-[2rem] border border-white/10 bg-black/30 p-8 shadow-[0_24px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:p-12" onSubmit={handleLoginSubmit(handleLogin)}>
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.5em] text-[#c8a96a]">Admin access</p>
              <h2 className="text-3xl font-semibold text-white">Sign in</h2>
            </div>

            <div className="mt-8 space-y-5">
              <label className="block space-y-2 text-sm text-white/70">
                <span>Email</span>
                <input type="email" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" placeholder="admin@example.com" {...registerLogin('email')} />
                {loginErrors.email && <span className="text-sm text-red-300">{loginErrors.email.message}</span>}
              </label>

              <label className="block space-y-2 text-sm text-white/70">
                <span>Password</span>
                <input type="password" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" placeholder="••••••••" {...registerLogin('password')} />
                {loginErrors.password && <span className="text-sm text-red-300">{loginErrors.password.message}</span>}
              </label>
            </div>

            <button type="submit" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c8a96a] px-5 py-3 text-sm font-medium text-black transition hover:bg-[#e2c98f]">
              Enter dashboard <ArrowRight size={16} />
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8 md:px-10 lg:px-16">
      <section className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#c8a96a]">Admin dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Portfolio content manager</h1>
            <p className="mt-2 text-sm text-white/60">Signed in as {user.email}</p>
          </div>

          <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:border-[#c8a96a]/60 hover:text-[#c8a96a]">
            <LogOut size={16} /> Sign out
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {statCard({ label: 'Projects', value: summary.total })}
          {statCard({ label: 'Media ready', value: summary.mediaReady })}
          {statCard({ label: 'Current draft', value: summary.draft })}
        </section>

        <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={handleSubmit(onSubmit)} className="rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-[0_24px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.5em] text-[#c8a96a]">Project form</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">{editingProjectId ? 'Edit project' : 'Add project'}</h2>
              </div>
              {editingProjectId ? (
                <button type="button" onClick={() => { setEditingProjectId(null); reset(emptyProject); }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:border-white/20">Cancel</button>
              ) : null}
            </div>

            <div className="mt-8 space-y-5">
              <label className="block space-y-2 text-sm text-white/70">
                <span>Title</span>
                <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" {...register('title')} />
                {errors.title && <span className="text-sm text-red-300">{errors.title.message}</span>}
              </label>

              <label className="block space-y-2 text-sm text-white/70">
                <span>Description</span>
                <textarea rows={5} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" {...register('description')} />
                {errors.description && <span className="text-sm text-red-300">{errors.description.message}</span>}
              </label>

              <label className="block space-y-2 text-sm text-white/70">
                <span>Tech stack</span>
                <input placeholder="React, Node.js, MongoDB" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" {...register('techStack')} />
                {errors.techStack && <span className="text-sm text-red-300">{errors.techStack.message}</span>}
                <p className="text-xs uppercase tracking-[0.35em] text-white/30">Preview: {techStackPreview || 'None yet'}</p>
              </label>

              <label className="block space-y-2 text-sm text-white/70">
                <span>GitHub link</span>
                <input placeholder="https://github.com/..." className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" {...register('githubLink')} />
                {errors.githubLink && <span className="text-sm text-red-300">{errors.githubLink.message}</span>}
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2 text-sm text-white/70">
                  <span>Image URL</span>
                  <input placeholder="Uploaded image URL" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" {...register('imageUrl')} />
                  {errors.imageUrl && <span className="text-sm text-red-300">{errors.imageUrl.message}</span>}
                </label>

                <label className="block space-y-2 text-sm text-white/70">
                  <span>Video URL</span>
                  <input placeholder="Uploaded video URL" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" {...register('videoUrl')} />
                  {errors.videoUrl && <span className="text-sm text-red-300">{errors.videoUrl.message}</span>}
                </label>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:border-[#c8a96a]/60 hover:text-[#c8a96a]">
                <input type="file" accept="image/*" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (file) { await handleFileUpload(file, 'image'); } event.currentTarget.value = ''; }} />
                <ImageIcon size={16} /> Upload image
              </label>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:border-[#c8a96a]/60 hover:text-[#c8a96a]">
                <input type="file" accept="video/*" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (file) { await handleFileUpload(file, 'video'); } event.currentTarget.value = ''; }} />
                <Video size={16} /> Upload video
              </label>

              <button type="submit" disabled={saving || uploading} className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#c8a96a] px-5 py-3 text-sm font-medium text-black transition hover:bg-[#e2c98f] disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? <Loader2 size={16} className="animate-spin" /> : editingProjectId ? <Edit3 size={16} /> : <Plus size={16} />}
                {editingProjectId ? 'Update project' : 'Create project'}
              </button>
            </div>
          </form>

          <div className="rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-[0_24px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.5em] text-[#c8a96a]">Project list</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Published content</h2>
              </div>
              <button type="button" onClick={async () => { try { setProjectsLoading(true); const data = await fetchProjects(); setProjects(data); toast.success('Projects refreshed'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Refresh failed'); } finally { setProjectsLoading(false); } }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:border-white/20">Refresh</button>
            </div>

            <div className="mt-8 space-y-4">
              {projectsLoading ? (
                <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-white/60"><Loader2 size={16} className="animate-spin" /> Loading projects...</div>
              ) : projects.length ? (
                projects.map((project) => (
                  <article key={project._id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-white">{project.title}</h3>
                          {project.githubLink ? (
                            <a href={project.githubLink} target="_blank" rel="noreferrer" className="text-white/45 transition hover:text-[#c8a96a]" aria-label="Open GitHub link"><Github size={16} /></a>
                          ) : null}
                        </div>
                        <p className="text-sm leading-7 text-white/65">{project.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {project.techStack.map((tech) => (
                            <span key={tech} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/55">{tech}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => fillProjectForm(project)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-[#c8a96a]/60 hover:text-[#c8a96a]" aria-label="Edit project"><Edit3 size={16} /></button>
                        <button onClick={() => handleDelete(project._id)} disabled={deletingId === project._id} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-red-400/60 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Delete project">{deletingId === project._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.35em] text-white/30">
                      <span>{project.imageUrl ? 'Image attached' : 'No image'}</span>
                      <span>{project.videoUrl ? 'Video attached' : 'No video'}</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-white/55">No projects yet. Create the first project from the form.</div>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
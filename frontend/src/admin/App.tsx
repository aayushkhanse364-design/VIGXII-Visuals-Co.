import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
} from "lucide-react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./lib/firebase";
import {
  createCategory,
  createProject,
  deleteCategory,
  deleteProject,
  fetchCategories,
  fetchProjects,
  type Category,
  type CategoryFormValues,
  type Project,
  type ProjectFormValues,
  updateCategory,
  updateProject,
  uploadMedia,
} from "../lib/api";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const projectSchema = z.object({
  title: z.string().or(z.literal("")),
  description: z.string().or(z.literal("")),
  techStack: z.string().or(z.literal("")),
  githubLink: z.string().or(z.literal("")),
  imageUrl: z.string().url("Enter a valid image URL").or(z.literal("")),
  videoUrl: z.string().url("Enter a valid video URL").or(z.literal("")),
  categoryId: z.string().or(z.literal("")),
});

const categorySchema = z.object({
  title: z.string().min(2, "Category title is required"),
  year: z.string().min(2, "Year is required"),
  coverUrl: z.string().url("Enter a valid cover URL").or(z.literal("")),
  order: z.coerce.number().int().min(0, "Order must be zero or greater"),
});

type LoginValues = z.infer<typeof loginSchema>;

const emptyProject: ProjectFormValues = {
  title: "",
  description: "",
  techStack: "",
  githubLink: "",
  imageUrl: "",
  videoUrl: "",
  categoryId: "",
};

const CONTACT_STORAGE_KEY = "vigxii-contact-settings";

type ContactSettings = {
  email: string;
  phone: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  x: string;
};

const defaultContactSettings: ContactSettings = {
  email: "studio@vigxii.com",
  phone: "+91 98765 43210",
  instagram: "https://instagram.com",
  youtube: "https://youtube.com",
  linkedin: "https://linkedin.com",
  x: "https://x.com",
};

const emptyCategory: CategoryFormValues = {
  title: "",
  year: "",
  coverUrl: "",
  order: 0,
};

function isAllowedAdminEmail(email: string) {
  const allowed = (import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((item: string) => item.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.toLowerCase());
}

function statCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-[10px] uppercase tracking-[0.45em] text-black/40">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-black">{value}</p>
    </div>
  );
}

function tabButtonClass(isActive: boolean) {
  return `rounded-full px-5 py-3 text-[10px] uppercase tracking-[0.45em] transition ${isActive ? "bg-[#c8a96a] text-black" : "border border-white/10 bg-white/5 text-white/65 hover:border-[#c8a96a]/60 hover:text-[#c8a96a]"}`;
}

export default function AdminApp() {
  if (!auth) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center text-white shadow-[0_24px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-[0.5em] text-[#c8a96a]">Admin setup</p>
          <h1 className="mt-4 text-3xl font-semibold">Firebase config missing</h1>
          <p className="mt-4 text-sm leading-7 text-white/70">
            Set the Firebase env vars (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`) and refresh the page.
          </p>
        </div>
      </main>
    );
  }

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [deletingCategoryId, setDeletingCategoryId] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"categories" | "projects" | "contact">("projects");
  const [contactSettings, setContactSettings] = useState<ContactSettings>(defaultContactSettings);

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
    register: registerCategory,
    handleSubmit: handleCategorySubmit,
    reset: resetCategory,
    setValue: setCategoryValue,
    watch: watchCategory,
    formState: { errors: categoryErrors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: emptyCategory,
  });

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const categoryCoverPreview = watchCategory("coverUrl");

  useEffect(() => {
    const stored = window.localStorage.getItem(CONTACT_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      setContactSettings({ ...defaultContactSettings, ...JSON.parse(stored) });
    } catch {
      setContactSettings(defaultContactSettings);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setToken("");
        setAuthLoading(false);
        return;
      }

      if (!isAllowedAdminEmail(currentUser.email || "")) {
        await signOut(auth);
        toast.error("This account is not allowed to access the admin panel");
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
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load projects"))
      .finally(() => {
        if (active) {
          setProjectsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;
    setCategoriesLoading(true);

    fetchCategories()
      .then((data) => {
        if (active) {
          setCategories(data);
        }
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load categories"))
      .finally(() => {
        if (active) {
          setCategoriesLoading(false);
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
      categories: categories.length.toString(),
    };
  }, [projects, categories]);

  async function handleLogin(values: LoginValues) {
    try {
      const credential = await signInWithEmailAndPassword(auth, values.email, values.password);

      if (!isAllowedAdminEmail(credential.user.email || "")) {
        await signOut(auth);
        toast.error("Only the configured admin account can log in");
        return;
      }

      setUser(credential.user);
      setToken(await credential.user.getIdToken(true));
      toast.success("Welcome back");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    }
  }

  async function handleLogout() {
    await signOut(auth);
    setUser(null);
    setToken("");
    setProjects([]);
    setEditingProjectId(null);
    reset(emptyProject);
    window.history.pushState({}, "", "/");
    toast.success("Signed out");
  }

  function fillProjectForm(project: Project) {
    setEditingProjectId(project._id);
    setValue("title", project.title);
    setValue("description", project.description);
    setValue("techStack", project.techStack.join(", "));
    setValue("githubLink", project.githubLink || "");
    setValue("imageUrl", project.imageUrl || "");
    setValue("videoUrl", project.videoUrl || "");
    setValue("categoryId", project.categoryId || "");
    setActiveTab("projects");
    toast("Editing project");
  }

  async function onSubmit(values: ProjectFormValues) {
    if (!token) {
      toast.error("Please sign in again");
      return;
    }

    setSaving(true);
    try {
      const selectedCategory = categories.find((category) => category._id === values.categoryId);
      const payload = {
        title: values.title.trim() || selectedCategory?.title || "Uploaded Project",
        description: values.description.trim() || `Media uploaded for ${selectedCategory?.title || "the portfolio"}.`,
        techStack: values.techStack.trim() || "Media",
        githubLink: values.githubLink.trim(),
        imageUrl: values.imageUrl,
        videoUrl: values.videoUrl,
        categoryId: values.categoryId || undefined,
      };

      if (editingProjectId) {
        await updateProject(token, editingProjectId, payload);
        toast.success("Project updated");
      } else {
        await createProject(token, payload);
        toast.success("Project created");
      }

      const refreshed = await fetchProjects();
      setProjects(refreshed);
      setEditingProjectId(null);
      reset(emptyProject);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(projectId: string) {
    if (!token) {
      return;
    }

    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) {
      return;
    }

    setDeletingId(projectId);
    try {
      await deleteProject(token, projectId);
      setProjects((current) => current.filter((project) => project._id !== projectId));
      toast.success("Project deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingId("");
    }
  }

  function fillCategoryForm(category: Category) {
    setEditingCategoryId(category._id);
    setCategoryValue("title", category.title);
    setCategoryValue("year", category.year);
    setCategoryValue("coverUrl", category.coverUrl);
    setCategoryValue("order", category.order);
    toast("Editing category");
  }

  async function onCategorySubmit(values: CategoryFormValues) {
    if (!token) {
      toast.error("Please sign in again");
      return;
    }

    setSavingCategory(true);
    try {
      if (editingCategoryId) {
        await updateCategory(token, editingCategoryId, values);
        toast.success("Category updated");
      } else {
        await createCategory(token, values);
        toast.success("Category created");
      }

      const refreshed = await fetchCategories();
      setCategories(refreshed);
      setEditingCategoryId(null);
      resetCategory(emptyCategory);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save category");
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (!token) {
      return;
    }

    const confirmed = window.confirm("Delete this category?");
    if (!confirmed) {
      return;
    }

    setDeletingCategoryId(categoryId);
    try {
      await deleteCategory(token, categoryId);
      setCategories((current) => current.filter((category) => category._id !== categoryId));
      toast.success("Category deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingCategoryId("");
    }
  }

  async function handleFileUpload(file: File, kind: "image" | "video") {
    if (!token) {
      toast.error("Please sign in first");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadMedia(token, file);
      if (result.resourceType !== kind) {
        toast("Uploaded successfully, but the media type differs from the selected field");
      }

      if (kind === "image") {
        setValue("imageUrl", result.url);
      } else {
        setValue("videoUrl", result.url);
      }

      toast.success(`${kind === "image" ? "Image" : "Video"} uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleCategoryUpload(file: File) {
    if (!token) {
      toast.error("Please sign in first");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadMedia(token, file);
      if (result.resourceType !== "image") {
        toast("Uploaded successfully, but the media type differs from the cover field");
      }

      setCategoryValue("coverUrl", result.url);
      toast.success("Category cover uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleContactSave(event: React.FormEvent) {
    event.preventDefault();
    setSavingContact(true);

    try {
      window.localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(contactSettings));
      toast.success("Contact details saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save contact details");
    } finally {
      setSavingContact(false);
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
            <h1 className="text-5xl font-semibold tracking-tight text-black md:text-7xl">Manage the portfolio without touching code.</h1>
            <p className="max-w-2xl text-base leading-8 text-gray-700 md:text-lg">Firebase email/password login, backend token verification, and Cloudinary media upload keep content publishing secure and simple.</p>
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
            <h1 className="mt-2 text-3xl font-semibold text-black md:text-4xl">Portfolio content manager</h1>
            <p className="mt-2 text-sm text-gray-700">Signed in as {user.email}</p>
          </div>

          <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:border-[#c8a96a]/60 hover:text-[#c8a96a]">
            <LogOut size={16} /> Sign out
          </button>
        </header>

        <nav className="flex flex-wrap gap-3 rounded-[2rem] border border-white/10 bg-black/30 p-3 shadow-[0_24px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <button type="button" onClick={() => setActiveTab("categories")} className={tabButtonClass(activeTab === "categories")}>Category</button>
          <button type="button" onClick={() => setActiveTab("projects")} className={tabButtonClass(activeTab === "projects")}>Projects</button>
          <button type="button" onClick={() => setActiveTab("contact")} className={tabButtonClass(activeTab === "contact")}>Contact</button>
        </nav>

        <section className="grid gap-4 md:grid-cols-4">
          {statCard({ label: 'Projects', value: summary.total })}
          {statCard({ label: 'Media ready', value: summary.mediaReady })}
          {statCard({ label: 'Current draft', value: summary.draft })}
          {statCard({ label: 'Categories', value: summary.categories })}
        </section>

        {activeTab === "categories" ? (
        <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={handleCategorySubmit(onCategorySubmit)} className="rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-[0_24px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.5em] text-[#c8a96a]">Category form</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">{editingCategoryId ? 'Edit category' : 'Add category'}</h2>
              </div>
              {editingCategoryId ? (
                <button type="button" onClick={() => { setEditingCategoryId(null); resetCategory(emptyCategory); }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:border-white/20">Cancel</button>
              ) : null}
            </div>

            <div className="mt-8 space-y-5">
              <label className="block space-y-2 text-sm text-white/70">
                <span>Title</span>
                <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" {...registerCategory('title')} />
                {categoryErrors.title && <span className="text-sm text-red-300">{categoryErrors.title.message}</span>}
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2 text-sm text-white/70">
                  <span>Year</span>
                  <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" {...registerCategory('year')} />
                  {categoryErrors.year && <span className="text-sm text-red-300">{categoryErrors.year.message}</span>}
                </label>

                <label className="block space-y-2 text-sm text-white/70">
                  <span>Order</span>
                  <input type="number" min="0" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" {...registerCategory('order')} />
                  {categoryErrors.order && <span className="text-sm text-red-300">{categoryErrors.order.message}</span>}
                </label>
              </div>

              <label className="block space-y-2 text-sm text-white/70">
                <span>Cover URL</span>
                <input placeholder="Uploaded cover URL" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" {...registerCategory('coverUrl')} />
                {categoryErrors.coverUrl && <span className="text-sm text-red-300">{categoryErrors.coverUrl.message}</span>}
                <p className="text-xs uppercase tracking-[0.35em] text-white/30">Preview: {categoryCoverPreview ? 'Cover ready' : 'No cover yet'}</p>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:border-[#c8a96a]/60 hover:text-[#c8a96a]">
                <input type="file" accept="image/*" className="hidden" onChange={async (event) => { const file = event.target.files?.[0]; if (file) { await handleCategoryUpload(file); } event.currentTarget.value = ''; }} />
                <ImageIcon size={16} /> Upload cover
              </label>

              <button type="submit" disabled={savingCategory || uploading} className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#c8a96a] px-5 py-3 text-sm font-medium text-black transition hover:bg-[#e2c98f] disabled:cursor-not-allowed disabled:opacity-60">
                {savingCategory ? <Loader2 size={16} className="animate-spin" /> : editingCategoryId ? <Edit3 size={16} /> : <Plus size={16} />}
                {editingCategoryId ? 'Update category' : 'Create category'}
              </button>
            </div>
          </form>

          <div className="rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-[0_24px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.5em] text-[#c8a96a]">Category list</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Portfolio sections</h2>
              </div>
              <button type="button" onClick={async () => { try { setCategoriesLoading(true); const data = await fetchCategories(); setCategories(data); toast.success('Categories refreshed'); } catch (error) { toast.error(error instanceof Error ? error.message : 'Refresh failed'); } finally { setCategoriesLoading(false); } }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:border-white/20">Refresh</button>
            </div>

            <div className="mt-8 space-y-4">
              {categoriesLoading ? (
                <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-white/60"><Loader2 size={16} className="animate-spin" /> Loading categories...</div>
              ) : categories.length ? (
                categories.map((category) => (
                  <article key={category._id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-4">
                        <div className="h-20 w-28 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                          <img src={category.coverUrl} alt={category.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-semibold text-white">{category.title}</h3>
                            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/55">{category.year}</span>
                          </div>
                          <p className="text-sm leading-7 text-white/65">Order: {category.order}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => fillCategoryForm(category)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-[#c8a96a]/60 hover:text-[#c8a96a]" aria-label="Edit category"><Edit3 size={16} /></button>
                        <button onClick={() => handleDeleteCategory(category._id)} disabled={deletingCategoryId === category._id} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-red-400/60 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Delete category">{deletingCategoryId === category._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-white/55">No categories yet. Create the first portfolio section from the form.</div>
              )}
            </div>
          </div>
        </section>
        ) : null}

        {activeTab === "projects" ? (
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
              <input type="hidden" {...register('title')} />
              <input type="hidden" {...register('description')} />
              <input type="hidden" {...register('techStack')} />
              <input type="hidden" {...register('githubLink')} />

              <label className="block space-y-2 text-sm text-white/70">
                <span>Category</span>
                <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-black outline-none transition focus:border-[#c8a96a]/60" {...register('categoryId')}>
                  <option value="" className="text-black">Unassigned</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id} className="text-black">{category.title}</option>
                  ))}
                </select>
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
        ) : null}

        {activeTab === "contact" ? (
        <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={handleContactSave} className="rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-[0_24px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.5em] text-[#c8a96a]">Contact settings</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Manage contact links</h2>
            </div>

            <div className="mt-8 space-y-5">
              <label className="block space-y-2 text-sm text-white/70">
                <span>Email</span>
                <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" value={contactSettings.email} onChange={(event) => setContactSettings((current) => ({ ...current, email: event.target.value }))} />
              </label>

              <label className="block space-y-2 text-sm text-white/70">
                <span>Phone</span>
                <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" value={contactSettings.phone} onChange={(event) => setContactSettings((current) => ({ ...current, phone: event.target.value }))} />
              </label>

              <label className="block space-y-2 text-sm text-white/70">
                <span>Instagram</span>
                <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" value={contactSettings.instagram} onChange={(event) => setContactSettings((current) => ({ ...current, instagram: event.target.value }))} />
              </label>

              <label className="block space-y-2 text-sm text-white/70">
                <span>YouTube</span>
                <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" value={contactSettings.youtube} onChange={(event) => setContactSettings((current) => ({ ...current, youtube: event.target.value }))} />
              </label>

              <label className="block space-y-2 text-sm text-white/70">
                <span>LinkedIn</span>
                <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" value={contactSettings.linkedin} onChange={(event) => setContactSettings((current) => ({ ...current, linkedin: event.target.value }))} />
              </label>

              <label className="block space-y-2 text-sm text-white/70">
                <span>X</span>
                <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#c8a96a]/60" value={contactSettings.x} onChange={(event) => setContactSettings((current) => ({ ...current, x: event.target.value }))} />
              </label>
            </div>

            <button type="submit" disabled={savingContact} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#c8a96a] px-5 py-3 text-sm font-medium text-black transition hover:bg-[#e2c98f] disabled:cursor-not-allowed disabled:opacity-60">
              {savingContact ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Save contact details
            </button>
          </form>

          <div className="rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-[0_24px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
            <p className="text-[10px] uppercase tracking-[0.5em] text-[#c8a96a]">Contact preview</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">What the public site uses</h2>
            <div className="mt-8 space-y-4 text-sm text-white/70">
              <p>Email: {contactSettings.email}</p>
              <p>Phone: {contactSettings.phone}</p>
              <p>Instagram: {contactSettings.instagram}</p>
              <p>YouTube: {contactSettings.youtube}</p>
              <p>LinkedIn: {contactSettings.linkedin}</p>
              <p>X: {contactSettings.x}</p>
            </div>
          </div>
        </section>
        ) : null}
      </section>
    </main>
  );
}
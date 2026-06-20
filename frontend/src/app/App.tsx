import { useEffect, useMemo, useRef, useState } from "react";
import { Instagram, Mail, ArrowRight, Check } from "lucide-react";
import AdminApp from "../admin/App";
import { fetchCategories, fetchProjects, type Category as CategoryRecord, type Project } from "../lib/api";

type ImageEntry = { url: string; alt: string; type?: "photo" | "video" };

type Category = {
  id: string;
  title: string;
  year: string;
  cover: string;
  images: ImageEntry[];
};

const CONTACT_STORAGE_KEY = "vigxii-contact-settings";

const defaultContactSettings = {
  email: "walunjvigxii@gmail.com",
  phone: "8591126687",
  instagram: "https://www.instagram.com/vigxiivisuals?igsh=OTY0YWVmNjlrbXFj",
};

const u = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "graphic-design",
    title: "Graphic Design",
    year: "24",
    cover: u("1710438399422", 900, 620),
    images: [
      { url: u("1710438399422", 1200, 800), alt: "Abstract dark wavy graphic", type: "photo" },
      { url: u("1620207418302", 1200, 800), alt: "Purple fluid abstract", type: "video" },
      { url: u("1566410824233", 1200, 800), alt: "Multicolored painterly composition", type: "photo" },
    ],
  },
  {
    id: "commercials",
    title: "Commercials",
    year: "24",
    cover: u("1772191399367", 900, 620),
    images: [
      { url: u("1640496206917", 1200, 800), alt: "Clock product editorial", type: "photo" },
      { url: u("1772191399367", 1200, 800), alt: "Obsidian elixir bottle", type: "video" },
      { url: u("1740026380145", 1200, 800), alt: "Commercial brand still", type: "photo" },
    ],
  },
  {
    id: "food",
    title: "Food",
    year: "23",
    cover: u("1590741664176", 900, 620),
    images: [
      { url: u("1590741664176", 1200, 800), alt: "Cupcake with strawberry", type: "photo" },
      { url: u("1647230373280", 1200, 800), alt: "Apples in a bowl", type: "photo" },
      { url: u("1724424280318", 1200, 800), alt: "Blackberries in metal bowl", type: "video" },
    ],
  },
  {
    id: "photos",
    title: "Photos",
    year: "24",
    cover: u("1774379456512", 900, 620),
    images: [
      { url: u("1774379456512", 1200, 800), alt: "Woman under spotlight", type: "photo" },
      { url: u("1769650795757", 1200, 800), alt: "Woman with curly hair", type: "photo" },
      { url: u("1760595955091", 1200, 800), alt: "Dramatic colored light portrait", type: "video" },
    ],
  },
  {
    id: "automobile",
    title: "Automobile",
    year: "24",
    cover: u("1646283181928", 900, 620),
    images: [
      { url: u("1646283181928", 1200, 800), alt: "Red car in dark studio", type: "photo" },
      { url: u("1651561028053", 1200, 800), alt: "Black car with silver grille", type: "video" },
      { url: u("1705563666935", 1200, 800), alt: "Car illuminated in darkness", type: "photo" },
    ],
  },
  {
    id: "videography",
    title: "Videography",
    year: "24",
    cover: u("1578426187376", 900, 620),
    images: [
      { url: u("1578426187376", 1200, 800), alt: "Ornate chandelier interior", type: "video" },
      { url: u("1526289034009", 1200, 800), alt: "Modernist building facade", type: "video" },
      { url: u("1623601716829", 1200, 800), alt: "Glass window framing", type: "photo" },
    ],
  },
  {
    id: "architecture",
    title: "Architecture",
    year: "23",
    cover: u("1472803828399", 900, 620),
    images: [
      { url: u("1526289034009", 1200, 800), alt: "Brutalist building exterior", type: "photo" },
      { url: u("1472803828399", 1200, 800), alt: "Stone stairs beside building", type: "photo" },
      { url: u("1643175517006", 1200, 800), alt: "Glass tower skyward", type: "video" },
    ],
  },
  {
    id: "events",
    title: "Festival / Events",
    year: "24",
    cover: u("1764255510960", 900, 620),
    images: [
      { url: u("1764255510960", 1200, 800), alt: "Gala dining under disco ball", type: "photo" },
      { url: u("1765229276796", 1200, 800), alt: "Elegant gowns at event", type: "video" },
      { url: u("1752119323879", 1200, 800), alt: "Guests at outdoor night event", type: "photo" },
    ],
  },
  {
    id: "humans",
    title: "Humans",
    year: "24",
    cover: u("1760595955091", 900, 620),
    images: [
      { url: u("1774379456512", 1200, 800), alt: "Spotlight portrait", type: "photo" },
      { url: u("1765229276796", 1200, 800), alt: "Elegant fashion portrait", type: "video" },
      { url: u("1769650795757", 1200, 800), alt: "Studio natural light portrait", type: "photo" },
    ],
  },
];

/* ─── Contact Page ────────────────────────────────── */
function ContactPage({ onHome }: { onHome: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", service: "", message: "" });
  const [sent, setSent] = useState(false);
  const [contactSettings, setContactSettings] = useState(defaultContactSettings);

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const inputClass =
    "w-full bg-transparent border-b border-black/15 py-3 text-[13px] text-black placeholder-black/30 tracking-wide focus:outline-none focus:border-[#C8A96A] transition-colors duration-300";

  const labelClass =
    "block text-[9px] tracking-[0.45em] text-black/35 uppercase mb-2";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#ffffff" }}>
      <SiteHeader onWorkClick={onHome} onLogoClick={onHome} onContactClick={() => {}} />

      {/* Divider */}
      <div className="mx-auto mb-12 h-px max-w-5xl" style={{ backgroundColor: "rgba(0,0,0,0.08)" }} />

      {/* Form area */}
      <section className="px-8 pb-24 md:px-12 lg:px-16" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="mx-auto max-w-lg">
          {!sent ? (
            <>
              {/* Heading */}
              <div className="mb-10">
                <p className="text-[9px] tracking-[0.5em] text-[#C8A96A] uppercase mb-3">
                  Get in Touch
                </p>
                <h2
                  className="text-3xl font-light tracking-[0.12em] text-black uppercase"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Let's Work Together
                </h2>
              </div>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                  <div>
                    <label htmlFor="cf-name" className={labelClass}>Your Name</label>
                    <input
                      id="cf-name"
                      type="text"
                      required
                      placeholder="Alex Rivera"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="cf-email" className={labelClass}>Email Address</label>
                    <input
                      id="cf-email"
                      type="email"
                      required
                      placeholder="alex@studio.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cf-service" className={labelClass}>Type of Project</label>
                  <select
                    id="cf-service"
                    required
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    className={inputClass + " cursor-pointer appearance-none"}
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    <option value="" disabled hidden>Select a service</option>
                    <option value="photography">Photography</option>
                    <option value="videography">Videography</option>
                    <option value="commercials">Commercials</option>
                    <option value="graphic-design">Graphic Design</option>
                    <option value="events">Events Coverage</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="cf-message" className={labelClass}>Tell Us About Your Vision</label>
                  <textarea
                    id="cf-message"
                    rows={5}
                    required
                    placeholder="Describe your project, timeline, and any details..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={inputClass + " resize-none leading-relaxed"}
                  />
                </div>

                <button
                  type="submit"
                  className="group mt-1 flex w-full items-center justify-between border border-black/15 px-6 py-4 text-[10px] tracking-[0.4em] text-black/60 uppercase transition-all duration-300 hover:border-[#C8A96A]/60 hover:text-[#C8A96A] focus:outline-none"
                >
                  Send Message
                  <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                </button>

                <p className="text-center text-[10px] tracking-[0.3em] text-black/35" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {contactSettings.phone}
                </p>
                <p className="text-center text-[10px] tracking-[0.3em] text-black/30" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {contactSettings.email}
                </p>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="mb-6 flex h-12 w-12 items-center justify-center border border-[#C8A96A]/40">
                <Check size={20} className="text-[#C8A96A]" strokeWidth={1.5} />
              </div>
              <p
                className="text-2xl font-light tracking-[0.15em] text-black uppercase mb-3"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Message Sent
              </p>
              <p className="text-[10px] tracking-[0.35em] text-black/35 uppercase mb-10">
                We'll be in touch shortly
              </p>
              <button
                onClick={onHome}
                className="text-[9px] tracking-[0.4em] text-black/30 uppercase hover:text-[#C8A96A] transition-colors duration-200 focus:outline-none"
              >
                Back to Work
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto pb-6 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <p className="text-[10px] tracking-[0.45em] text-black/70 uppercase">
          VIGXII Visuals Co. by Vighnesh Walunj © 2024
        </p>
      </footer>
    </div>
  );
}

/* ─── Shared Site Header ──────────────────────────── */
function SiteHeader({
  onWorkClick,
  onLogoClick,
  onContactClick,
}: {
  onWorkClick?: () => void;
  onLogoClick: () => void;
  onContactClick: () => void;
}) {
  return (
    <header className="flex flex-col items-center pt-10 pb-8 px-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Brand name */}
      <button
        onClick={onLogoClick}
        className="focus:outline-none"
        aria-label="Go to homepage"
      >
        <h1
          className="text-xl md:text-2xl font-medium tracking-[0.35em] text-black uppercase mb-4 hover:text-[#C8A96A] transition-colors duration-300"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.3em" }}
        >
          VIGXII Visuals Co.
        </h1>
      </button>

      {/* Tagline */}
      <p className="text-[8px] tracking-[0.3em] text-black/30 uppercase mb-5" style={{ fontFamily: "'Inter', sans-serif" }}>
        Visual Storytelling&nbsp;&nbsp;·&nbsp;&nbsp;Cinematic Excellence&nbsp;&nbsp;·&nbsp;&nbsp;Creative Direction
      </p>

      {/* Nav links */}
      <nav className="flex items-center gap-8 mb-4">
        <button
          onClick={onWorkClick}
          className="text-[10px] tracking-[0.4em] text-black/55 uppercase transition-colors duration-200 hover:text-black focus:outline-none"
        >
          Work
        </button>
        <span className="text-black/15 text-[10px]">|</span>
        <button
          onClick={onContactClick}
          className="text-[10px] tracking-[0.4em] text-black/55 uppercase transition-colors duration-200 hover:text-black focus:outline-none"
        >
          Contact
        </button>
      </nav>

      {/* Social icons */}
      <div className="flex items-center gap-5">
        <a
          href={defaultContactSettings.instagram}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="text-black/40 hover:text-black transition-colors duration-200"
        >
          <Instagram size={18} strokeWidth={1.75} />
        </a>
        <a
          href={`https://wa.me/${defaultContactSettings.phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="text-black/40 hover:text-black transition-colors duration-200"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 .1 5.2.1 11.8c0 2.1.5 4.1 1.5 5.9L0 24l6.5-1.7a11.8 11.8 0 0 0 5.5 1.4h.1c6.6 0 11.9-5.3 11.9-11.8 0-3.2-1.3-6.2-3.5-8.4Zm-8.4 18.1h-.1a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.8 1 1-3.7-.2-.4a9.8 9.8 0 0 1-1.5-5.2C2.1 6.2 6.1 2.2 12 2.2c2.6 0 5 1 6.8 2.8a9.6 9.6 0 0 1 2.8 6.8c0 5.9-4.8 9.8-9.5 9.8Zm5.6-7.3c-.3-.1-2-.9-2.3-1s-.5-.1-.7.1-.9 1-.1 1.2c.9.4 1.6.7 1.9.8.2.1.4.1.6-.1.2-.2.8-.9 1-1.2.2-.3.2-.5.1-.6-.1-.2-.6-.3-.9-.4Zm-3.5-4.4c.2.1.3.1.4.3.1.2.1.8 0 1s-.2.3-.4.4c-.2.1-.4.1-.5.1-.2 0-.4-.1-.7-.2-.3-.1-1.3-.6-1.8-1.1-.5-.5-.8-1-.9-1.2-.1-.2 0-.4.1-.5l.3-.3c.1-.1.2-.2.3-.4.1-.1.2-.3.3-.4.1-.2 0-.4-.1-.6-.1-.1-.7-1.6-1-2.2-.3-.6-.6-.5-.7-.5h-.6c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.4.9 2.6c.1.2 1.8 2.8 4.4 3.9.6.3 1 .4 1.4.6.6.2 1.1.2 1.5.1.5-.1 2-.8 2.2-1.5.3-.7.3-1.2.2-1.4-.1-.2-.3-.2-.6-.3-.3-.1-1.6-.8-1.8-.9-.2 0-.4-.1-.6.1-.2.1-.7.9-.9 1.1-.2.2-.4.2-.6.1-.2-.1-.8-.3-1.6-.9-.6-.4-1-1-1.1-1.2-.1-.2 0-.4.1-.5.1-.1.2-.2.3-.4.1-.1.1-.2.2-.4.1-.2 0-.4 0-.5-.1-.1-.5-1.1-.7-1.5-.2-.4-.3-.3-.4-.3h-.4c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.1 1 2.3.2.2 1.6 2.4 3.9 3.4.5.3.9.4 1.2.5Z" />
          </svg>
        </a>
        <a
          href={`mailto:${defaultContactSettings.email}`}
          aria-label="Email"
          className="text-black/40 hover:text-black transition-colors duration-200"
        >
          <Mail size={18} strokeWidth={1.75} />
        </a>
      </div>
    </header>
  );
}

/* ─── Portfolio Card ──────────────────────────────── */
function PortfolioCard({
  category,
  onClick,
}: {
  category: Category;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group block w-full text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C8A96A]"
    >
      {/* Thumbnail */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/2", backgroundColor: "#f0f0f0" }}>
        <img
          src={category.cover}
          alt={category.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          loading="lazy"
        />
      </div>

      {/* Text below image */}
      <div className="pt-3 pb-1" style={{ fontFamily: "'Inter', sans-serif" }}>
        <p
          className="text-[11px] tracking-[0.35em] text-black/80 uppercase group-hover:text-[#C8A96A] transition-colors duration-300"
        >
          {category.title}
        </p>
        <p className="mt-1 text-[9px] tracking-[0.3em] text-black/25">
          {category.year}
        </p>
      </div>
    </button>
  );
}

function MediaCard({ project }: { project: Project }) {
  const hasVideo = Boolean(project.videoUrl);
  const hasImage = Boolean(project.imageUrl);

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-black/10 bg-white shadow-[0_16px_60px_rgba(0,0,0,0.06)] transition-transform duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f4f1eb]">
        {hasVideo ? (
          <video
            src={project.videoUrl}
            poster={project.imageUrl || undefined}
            autoPlay
            loop
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : hasImage ? (
          <img
            src={project.imageUrl}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.04),_transparent_55%)]" />
        )}
      </div>
    </article>
  );
}

function FullscreenMediaViewer({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 px-4 py-6"
      onClick={onClose}
      role="presentation"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] tracking-[0.45em] text-white/85 uppercase backdrop-blur-sm transition hover:bg-white/15"
      >
        Close
      </button>

      <div
        className="relative h-full w-full max-w-[96vw] max-h-[92vh] overflow-hidden rounded-[1.5rem] bg-black shadow-[0_24px_120px_rgba(0,0,0,0.65)]"
        onClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        {project.videoUrl ? (
          <video
            src={project.videoUrl}
            poster={project.imageUrl || undefined}
            controls
            autoPlay
            playsInline
            className="h-full w-full object-contain bg-black"
          />
        ) : (
          <img
            src={project.imageUrl}
            alt={project.title}
            className="h-full w-full object-contain bg-black"
          />
        )}
      </div>
    </div>
  );
}

/* ─── Home Page ───────────────────────────────────── */
function HomePage({
  categories,
  onCategoryClick,
  onContactClick,
}: {
  categories: Category[];
  onCategoryClick: (id: string) => void;
  onContactClick: () => void;
}) {
  const gridRef = useRef<HTMLElement>(null);

  const scrollToWork = () =>
    gridRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#ffffff" }}>
      <SiteHeader onWorkClick={scrollToWork} onLogoClick={scrollToWork} onContactClick={onContactClick} />

      {/* Divider */}
      <div className="mx-auto mb-12 h-px max-w-5xl" style={{ backgroundColor: "rgba(0,0,0,0.08)" }} />

      {/* Portfolio grid */}
      <section ref={gridRef} className="px-8 pb-4 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
          {categories.length ? categories.map((cat) => (
            <PortfolioCard
              key={cat.id}
              category={cat}
              onClick={() => onCategoryClick(cat.id)}
            />
          )) : (
            <div className="col-span-full rounded-3xl border border-dashed border-black/10 bg-black/[0.02] px-6 py-16 text-center text-[10px] tracking-[0.35em] text-black/40 uppercase">
              No categories published yet
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto pb-6 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-[11px] tracking-[0.4em] text-black/60 uppercase hover:text-[#C8A96A] transition-colors duration-200 focus:outline-none mb-6 block mx-auto"
        >
          Back to Top
        </button>
        <p className="text-[10px] tracking-[0.45em] text-black/70 uppercase">
          VIGXII Visuals Co. by Vighnesh Walunj © 2024
        </p>
      </footer>
    </div>
  );
}

/* ─── Category Page ───────────────────────────────── */
function CategoryPage({
  category,
  projects,
  onHome,
  onContactClick,
}: {
  category: Category;
  projects: Project[];
  onHome: () => void;
  onContactClick: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "photo" | "video">("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const categoryProjects = projects.filter((project) => project.categoryId === category.id);
  const filtered = filter === "all"
    ? categoryProjects
    : categoryProjects.filter((project) => (filter === "photo" ? Boolean(project.imageUrl) : Boolean(project.videoUrl)));

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#ffffff" }}>
      <SiteHeader onWorkClick={onHome} onLogoClick={onHome} onContactClick={onContactClick} />

      {/* Divider */}
      <div className="mx-auto mb-12 h-px max-w-5xl" style={{ backgroundColor: "rgba(0,0,0,0.08)" }} />

      {/* Category title + filter buttons */}
      <section className="px-8 pb-10 text-center md:px-12 lg:px-16">
        <h2
          className="text-2xl font-bold leading-none tracking-[0.12em] text-black md:text-3xl lg:text-4xl uppercase"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {category.title}
        </h2>

        {/* Filter buttons */}
        <div className="mt-6 flex items-center justify-center gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
          {(["photo", "video"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter((prev) => prev === type ? "all" : type)}
              className="px-5 py-2 text-[9px] tracking-[0.4em] uppercase transition-all duration-200 focus:outline-none border"
              style={{
                borderColor: filter === type ? "#C8A96A" : "rgba(0,0,0,0.15)",
                color: filter === type ? "#C8A96A" : "rgba(0,0,0,0.4)",
                backgroundColor: "transparent",
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      {/* Image grid */}
      <section className="px-8 pb-4 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <button
              key={project._id}
              type="button"
              onClick={() => setSelectedProject(project)}
              className="group text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C8A96A]"
            >
              <MediaCard project={project} />
            </button>
          ))}
        </div>
        {!filtered.length ? (
          <div className="mt-8 rounded-2xl border border-black/10 bg-black/[0.02] px-6 py-10 text-center text-sm tracking-[0.18em] text-black/45 uppercase">
            Uploaded media for this category will appear here.
          </div>
        ) : null}
      </section>

      {selectedProject ? (
        <FullscreenMediaViewer project={selectedProject} onClose={() => setSelectedProject(null)} />
      ) : null}

      {/* Footer */}
      <footer className="mt-auto pb-6 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <button
          onClick={onHome}
          className="text-[11px] tracking-[0.4em] text-black/60 uppercase hover:text-[#C8A96A] transition-colors duration-200 focus:outline-none mb-6 block mx-auto"
        >
          Back to Top
        </button>
        <p className="text-[10px] tracking-[0.45em] text-black/70 uppercase">
          VIGXII Visuals Co. by Vighnesh Walunj © 2024
        </p>
      </footer>
    </div>
  );
}

/* ─── Root ────────────────────────────────────────── */
type View = { type: "home" } | { type: "category"; id: string } | { type: "contact" };

export default function App() {
  const [view, setView] = useState<View>({ type: "home" });
  const [remoteCategories, setRemoteCategories] = useState<CategoryRecord[]>([]);
  const [remoteProjects, setRemoteProjects] = useState<Project[]>([]);
  const isAdminRoute = window.location.pathname.startsWith("/admin");

  const goHome = () => { setView({ type: "home" }); window.scrollTo({ top: 0 }); };
  const goContact = () => { setView({ type: "contact" }); window.scrollTo({ top: 0 }); };

  useEffect(() => {
    let active = true;

    fetchCategories()
      .then((data) => {
        if (active) {
          setRemoteCategories(data);
        }
      })
      .catch(() => {
        if (active) {
          setRemoteCategories([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetchProjects()
      .then((data) => {
        if (active) {
          setRemoteProjects(data);
        }
      })
      .catch(() => {
        if (active) {
          setRemoteProjects([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const categories: Category[] = remoteCategories.map((category) => ({
    id: category._id,
    title: category.title,
    year: category.year,
    cover: category.coverUrl,
    images: [],
  }));

  if (isAdminRoute) {
    return <AdminApp />;
  }

  if (view.type === "contact") {
    return <ContactPage onHome={goHome} />;
  }

  if (view.type === "category") {
    const cat = categories.find((c) => c.id === view.id);
    if (cat) {
      return (
        <CategoryPage
          category={cat}
          projects={remoteProjects}
          onHome={goHome}
          onContactClick={goContact}
        />
      );
    }
  }

  return (
    <HomePage
      categories={categories}
      onCategoryClick={(id) => { setView({ type: "category", id }); window.scrollTo({ top: 0 }); }}
      onContactClick={goContact}
    />
  );
}

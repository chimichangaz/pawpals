import React, { useRef } from "react";

const videoList = [
  {
    title: "How to take care of a puppy",
    description: "Learn the fundamentals of taking care of your dog with positive reinforcement techniques.",
    url: "https://www.youtube.com/watch?v=Ro0KH6hAnHA",
    category: "Training",
    duration: "6 min",
  },
  {
    title: "Puppy Potty Training - Complete Guide",
    description: "Step-by-step guide to house train your puppy quickly and effectively.",
    url: "https://www.youtube.com/watch?v=7vOXWCewEYM",
    category: "Training",
    duration: "10 min",
  },
  {
    title: "How to Stop Excessive Barking",
    description: "Proven techniques to reduce and control your dog's barking behavior.",
    url: "https://www.youtube.com/watch?v=1ln5lpH5Nf0",
    category: "Behavior",
    duration: "12 min",
  },
  {
    title: "Dog Grooming at Home - Complete Tutorial",
    description: "Professional grooming techniques you can do at home to keep your dog clean and healthy.",
    url: "https://www.youtube.com/watch?v=3GIbxJJMbCw",
    category: "Grooming",
    duration: "34 min",
  },
  {
    title: "First Aid for Dogs - Emergency Care",
    description: "Essential first aid skills every dog owner should know for emergency situations.",
    url: "https://www.youtube.com/watch?v=Yxtbvo2rFEA",
    category: "Health",
    duration: "1hr 5 min",
  },
  {
    title: "Leash Training Your Dog",
    description: "Master the art of loose leash walking with your dog using positive methods.",
    url: "https://www.youtube.com/watch?v=y2yj2xtCo-k",
    category: "Training",
    duration: "15 min",
  },
  {
    title: "Dog Nutrition - What to Feed Your Pet",
    description: "Complete guide to proper dog nutrition, portion sizes, and healthy feeding habits.",
    url: "https://www.youtube.com/watch?v=XIxGBQfZigw",
    category: "Health",
    duration: "8 min",
  },
  {
    title: "Teaching Your Dog to Come When Called",
    description: "Reliable recall training techniques to keep your dog safe and responsive.",
    url: "https://www.youtube.com/watch?v=rwldfBjFsdE",
    category: "Training",
    duration: "7 min",
  },
  {
    title: "Dog Exercise Ideas for Rainy Days",
    description: "Indoor activities and mental stimulation games to keep your dog active during monsoons.",
    url: "https://www.youtube.com/watch?v=Ui9GwQ6OatE",
    category: "Exercise",
    duration: "9 min",
  },
  {
    title: "Understanding Dog Body Language",
    description: "Learn to read your dog's signals and understand what they're trying to communicate.",
    url: "https://www.youtube.com/watch?v=siy0eog48ys",
    category: "Behavior",
    duration: "5 min",
  },
];

function getYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.searchParams.has("v")) return u.searchParams.get("v");
    // handle youtu.be short links
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    // fallback: last path segment
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1];
  } catch (e) {
    return null;
  }
}

function VideoCard({ video }) {
  const ref = useRef(null);

  function onMouseMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top; // y position within the element
    const px = (x / rect.width - 0.5) * 20; // tilt range
    const py = (y / rect.height - 0.5) * -12;
    el.style.transform = `perspective(900px) rotateX(${py}deg) rotateY(${px}deg) translateZ(6px)`;
    el.style.boxShadow = `${-px * 1.6}px ${py * 1.2}px 40px rgba(16,24,40,0.12), 0 10px 30px rgba(2,6,23,0.08)`;
    // ambient glow via CSS variable
    el.style.setProperty("--glow-x", `${x}px`);
    el.style.setProperty("--glow-y", `${y}px`);
  }

  function onMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translateZ(0)";
    el.style.boxShadow = "0 8px 20px rgba(2,6,23,0.06)";
  }

  const videoId = getYouTubeId(video.url);
  const thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : `https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=800&q=60`;

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={() => window.open(video.url, "_blank")}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" ? window.open(video.url, "_blank") : null)}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-md border border-gray-100 transition-transform duration-200"
      style={{
        transformStyle: "preserve-3d",
        boxShadow: "0 8px 20px rgba(2,6,23,0.06)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(250,250,250,0.9))",
      }}
    >
      <div className="relative h-40 bg-gray-100">
        <img src={thumb} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-80" />
        <div className="absolute left-4 bottom-4 flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white text-lg shadow">▶</div>
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-xs text-white font-semibold shadow-sm">{video.category}</div>
        </div>
        <div
          className="absolute -z-10 pointer-events-none"
          style={{
            left: "var(--glow-x, 50%)",
            top: "var(--glow-y, 50%)",
            width: 240,
            height: 120,
            transform: "translate(-50%,-50%)",
            filter: "blur(36px)",
            background: "radial-gradient(circle at center, rgba(79, 70, 229, 0.18), transparent 40%)",
          }}
        />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900 leading-snug">{video.title}</h3>
          <div className="text-xs text-gray-500 whitespace-nowrap">{video.duration}</div>
        </div>
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{video.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-lg">🔗</span>
            <span className="text-sm font-medium text-emerald-600">Watch on YouTube</span>
          </div>
          <div className="text-sm text-gray-400">Click to open</div>
        </div>
      </div>
    </div>
  );
}

export default function PetVideos() {
  const containerRef = useRef(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-4 justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-300 flex items-center justify-center text-white text-2xl shadow-lg">🐶</div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">🎥 Pet Care Videos</h1>
              <p className="mt-2 text-gray-600">Curated, helpful videos for dog owners in Bangalore — training, health, grooming and more.</p>
            </div>
          </div>
        </header>

        <main ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoList.map((v, i) => (
            <VideoCard key={i} video={v} />
          ))}
        </main>

        <div className="mt-10 text-center">
          <div className="inline-block px-6 py-4 rounded-xl border-2 border-dashed border-gray-200 bg-white/60">
            <p className="text-gray-700 font-medium">📹 More videos coming soon!</p>
            <p className="text-sm text-gray-500 mt-2">Have a great pet care video to recommend? Share it in our Forum.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

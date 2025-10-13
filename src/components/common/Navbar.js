import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/", key: "home", label: "Home", icon: HomeIcon },
  { to: "/browse-pets", key: "browse", label: "Browse Pets", icon: DocsIcon },
  { to: "/events", key: "events", label: "Events", icon: BoltIcon },
  { to: "/pet-walk-tracker", key: "walk", label: "Walk Tracker", icon: WalkIcon },
  { to: "/vetclinics", key: "vet", label: "Vet Clinics", icon: VetIcon },
  { to: "/forum", key: "forum", label: "Forum", icon: ForumIcon },
  { to: "/pet-videos", key: "videos", label: "Pet Videos", icon: VideoIcon },
  { to: "/faq", key: "faq", label: "FAQ", icon: MoreIcon },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const [activeIndex, setActiveIndex] = useState(0);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef(null);

  // NUCLEAR BACKGROUND FIX - This will override ANY dark background
  useEffect(() => {
    // Remove all dark classes from body and html
    const removeDarkClasses = () => {
      const bodyClasses = document.body.classList;
      const htmlClasses = document.documentElement.classList;
      
      // Remove common dark mode classes
      ['dark', 'bg-black', 'bg-gray-900', 'bg-neutral-900', 'bg-slate-900', 'bg-gray-800', 'bg-zinc-900'].forEach(className => {
        bodyClasses.remove(className);
        htmlClasses.remove(className);
      });
      
      // Remove any class containing 'dark'
      const allClasses = Array.from(bodyClasses);
      allClasses.forEach(className => {
        if (className.includes('dark') || className.includes('black')) {
          bodyClasses.remove(className);
        }
      });
    };

    // Force light background with multiple methods
    const forceLightBackground = () => {
      // Method 1: Direct style manipulation
      document.body.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 50%, #fdf4ff 100%)';
      document.body.style.color = '#1f2937';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.minHeight = '100vh';
      document.body.style.width = '100vw';
      document.body.style.overflowX = 'hidden';
      
      // Method 2: HTML element too
      document.documentElement.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 50%, #fdf4ff 100%)';
      document.documentElement.style.color = '#1f2937';
      document.documentElement.style.margin = '0';
      document.documentElement.style.padding = '0';
      document.documentElement.style.minHeight = '100vh';
      
      // Method 3: Add light class
      document.body.classList.add('bg-gradient-to-br', 'from-slate-50', 'via-blue-50', 'to-purple-50');
      document.documentElement.classList.add('light');
    };

    // Method 4: Create and inject a style tag with !important
    const injectNuclearStyles = () => {
      const styleId = 'nuclear-background-fix';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          body {
            background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 50%, #fdf4ff 100%) !important;
            color: #1f2937 !important;
            margin: 0 !important;
            padding: 0 !important;
            min-height: 100vh !important;
            width: 100vw !important;
            overflow-x: hidden !important;
          }
          html {
            background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 50%, #fdf4ff 100%) !important;
            margin: 0 !important;
            padding: 0 !important;
            min-height: 100vh !important;
          }
          * {
            box-sizing: border-box;
          }
        `;
        document.head.appendChild(style);
      }
    };

    // Execute all methods
    removeDarkClasses();
    forceLightBackground();
    injectNuclearStyles();

    // Continuous monitoring to prevent any dark mode from coming back
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          removeDarkClasses();
          forceLightBackground();
        }
      });
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const idx = navItems.findIndex((i) => i.to === location.pathname);
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [location.pathname]);

  async function handleLogout() {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return (
    <>
      {/* Nuclear Background Overlay - This will cover ANY remaining black */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 z-[-100]"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 50%, #fdf4ff 100%)',
          margin: 0,
          padding: 0,
        }}
      />
      
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(1200px,calc(100%-48px))]">
        <nav className="relative rounded-full bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-xl shadow-purple-100/20 px-4 py-2 flex items-center justify-between">
          {/* Left: Brand */}
          <div className="flex items-center gap-3 min-w-[160px] flex-shrink-0">
            <Link to="/" className="flex items-center gap-3 no-underline">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center shadow-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2l3.5 7L22 10l-5 4 1.5 8L12 18l-6.5 4L7 14 2 10l6.5-1L12 2z" fill="currentColor" />
                </svg>
              </div>
              <span className="text-neutral-900 font-extrabold tracking-widest text-lg">PawPals</span>
            </Link>
          </div>

          {/* Center: pill menu */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-4 px-2">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const active = idx === activeIndex;
                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    className={`relative flex flex-col items-center gap-1 no-underline transition-all duration-200 px-3 py-1.5 rounded-full ${
                      active
                        ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/25 -translate-y-0.5"
                        : "text-neutral-600 hover:bg-gray-100/80 hover:text-neutral-800"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <div className={`flex items-center justify-center ${active ? "w-10 h-9" : "w-9 h-8"}`}>
                      <Icon className={active ? "w-5 h-5 text-white" : "w-5 h-5 text-neutral-600"} />
                    </div>
                    <span className={`text-xs ${active ? "font-medium text-white" : "text-neutral-600"}`}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: auth */}
          <div className="flex items-center gap-3 min-w-[160px] justify-end">
            {currentUser ? (
              <div className="relative">
                <button
                  ref={avatarRef}
                  onClick={() => setAvatarOpen((s) => !s)}
                  className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-100/80 transition"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-500 flex items-center justify-center text-white font-semibold uppercase shadow-sm">
                    {currentUser.displayName ? currentUser.displayName[0] : "U"}
                  </div>
                </button>

                {avatarOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-lg shadow-purple-100/20 py-2 z-50 animate-fade-in">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-purple-50/80 hover:text-purple-700 transition">Profile</Link>
                    <Link to="/my-pets" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-purple-50/80 hover:text-purple-700 transition">My Pets</Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50/80 transition">Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-3 py-1.5 rounded-md text-sm font-medium text-neutral-700 hover:bg-gray-100/80 hover:text-neutral-900 transition">Sign In</Link>
                <Link to="/register" className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition">Join</Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* spacer to avoid covering page content (matches header height) */}
      <div style={{ height: 92 }} />

      <style jsx global>{`
        /* Nuclear CSS that will override ANYTHING */
        body {
          background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 50%, #fdf4ff 100%) !important;
          background-attachment: fixed !important;
          color: #1f2937 !important;
          margin: 0 !important;
          padding: 0 !important;
          min-height: 100vh !important;
          width: 100% !important;
          overflow-x: hidden !important;
        }
        html {
          background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 50%, #fdf4ff 100%) !important;
          margin: 0 !important;
          padding: 0 !important;
          min-height: 100vh !important;
        }
        #root, .App, main, .main, .container, .page {
          background: transparent !important;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .animate-fade-in { animation: fadeIn .14s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </>
  );
}

// --- Icons --- (keep the same as before)
function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 21h14a1 1 0 0 0 1-1V11" />
      <path d="M9 21V13h6v8" />
    </svg>
  );
}
function DocsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 3h8l4 4v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3z" />
      <path d="M7 14h10M7 10h10" />
    </svg>
  );
}
function BoltIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}
function WalkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 20v-6l3-3 3 1 4-6 3 2v12" />
    </svg>
  );
}
function VetIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2v7" />
      <path d="M7 8h10" />
      <path d="M5 22h14v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2z" />
    </svg>
  );
}
function ForumIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function VideoIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M10 9l6 3-6 3V9z" />
    </svg>
  );
}
function MoreIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}
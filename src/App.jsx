import { useState, useMemo, useEffect, useCallback } from "react";
import EventCard from "./components/EventCard";
import AuthModal from "./components/Auth";
import { supabase } from "./lib/supabase";

// ---------------------------------------------------------------------------
// Data helpers – map Supabase snake_case rows → EventCard camelCase shape
// ---------------------------------------------------------------------------

/** Formats a Postgres DATE string ("2026-03-07") → "Sat, 7 Mar 2026" */
function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Maps a raw Supabase row to the shape expected by <EventCard /> */
function mapEvent(row) {
  return {
    ...row,
    date: formatDate(row.date),
    seatsLeft: row.seats_left,
    organiserEmail: row.organiser_email ?? null,
    organiserPhone: row.organiser_phone ?? null,
  };
}

// ---------------------------------------------------------------------------
// Fallback demo events – shown when Supabase is empty or unreachable
// ---------------------------------------------------------------------------
const FALLBACK_EVENTS = [
  {
    id: "f1",
    title: "AI & Machine Learning Bootcamp",
    date: "Wed, 4 Mar 2026",
    time: "10:00 AM",
    location: "Tech Hub, Room 201",
    description: "A hands-on full-day bootcamp covering neural networks, prompt engineering, and deploying ML models. Bring your laptop — we code from scratch! Topics include supervised learning, CNNs, transformers, and real-world deployment on cloud platforms.",
    seatsLeft: 45,
    category: "Tech",
    organiserEmail: "techclub@campus.edu",
    organiserPhone: "+91 98765 43210",
  },
  {
    id: "f2",
    title: "Spring Career Fair 2026",
    date: "Fri, 6 Mar 2026",
    time: "11:00 AM",
    location: "Main Hall — Expo Floor",
    description: "Meet 60+ companies from fintech, consulting, and engineering. Bring printed CVs and dress to impress. Free headshots provided on-site. Representatives from Google, Deloitte, Microsoft, and more will be present for on-the-spot interviews.",
    seatsLeft: 200,
    category: "Career",
    organiserEmail: "careers@campus.edu",
    organiserPhone: "+91 91234 56789",
  },
  {
    id: "f3",
    title: "Acoustic Open Mic Night",
    date: "Sat, 7 Mar 2026",
    time: "7:00 PM",
    location: "The Atrium Lounge",
    description: "Grab a coffee and settle in for an evening of original music by student artists. Sign up at the door or pre-register for a 10-minute slot. All genres welcome — acoustic, spoken word, comedy, and more.",
    seatsLeft: 80,
    category: "Music",
    organiserEmail: "musicclub@campus.edu",
    organiserPhone: "+91 99887 76655",
  },
  {
    id: "f4",
    title: "Web3 & Blockchain Workshop",
    date: "Tue, 10 Mar 2026",
    time: "2:00 PM",
    location: "Engineering Block, Lab 3",
    description: "Fundamentals of decentralised apps, smart contracts with Solidity, and how to ship a real dApp in a weekend. Beginners welcome. Laptops required. We will build and deploy a mini NFT contract on a testnet by the end of the session.",
    seatsLeft: 30,
    category: "Tech",
    organiserEmail: "web3society@campus.edu",
    organiserPhone: "+91 98001 23456",
  },
  {
    id: "f5",
    title: "Campus 5K Fun Run",
    date: "Wed, 11 Mar 2026",
    time: "8:00 AM",
    location: "Sports Oval — North Gate",
    description: "Lace up your trainers for a scenic 5K loop around campus. All fitness levels welcome. Free banana 🍌 at the finish line. Certificates issued to all finishers. Warm-up session begins at 7:45 AM.",
    seatsLeft: 150,
    category: "Sports",
    organiserEmail: "sportscommittee@campus.edu",
    organiserPhone: "+91 97654 32109",
  },
  {
    id: "f6",
    title: "Photography Masterclass",
    date: "Thu, 12 Mar 2026",
    time: "1:00 PM",
    location: "Arts Faculty, Studio B",
    description: "Pro photographer Mia Chen leads a 3-hour session on composition, natural light, and editing in Lightroom. DSLR or phone — both welcome. Participants will shoot a live portrait session and walk away with edited prints.",
    seatsLeft: 20,
    category: "Art",
    organiserEmail: "artclub@campus.edu",
    organiserPhone: "+91 96321 09876",
  },
  {
    id: "f7",
    title: "LinkedIn Profile Power Hour",
    date: "Fri, 13 Mar 2026",
    time: "12:00 PM",
    location: "Career Centre, Workshop Room",
    description: "Get your LinkedIn profile reviewed live by a recruiter. Walk out with a polished profile, keyword-optimised headline, and 3 actionable tips. Bring your laptop or phone. Limited to 25 attendees for personalised attention.",
    seatsLeft: 25,
    category: "Career",
    organiserEmail: "placementcell@campus.edu",
    organiserPhone: "+91 95432 10987",
  },
  {
    id: "f8",
    title: "International Street Food Festival",
    date: "Sat, 14 Mar 2026",
    time: "11:00 AM",
    location: "Campus Square — Outdoor Area",
    description: "18 stalls, 6 cuisines, zero bad choices. Dishes from Japan, Lebanon, Mexico, Nigeria, India, and Korea. Live DJ all afternoon. 🎶 Entry is free; bring cash or use campus pay for food tokens.",
    seatsLeft: 500,
    category: "Food",
    organiserEmail: "culturalcommittee@campus.edu",
    organiserPhone: "+91 94321 87654",
  },
  {
    id: "f9",
    title: "Hackathon 2026 — 24 Hours to Build",
    date: "Wed, 18 Mar 2026",
    time: "9:00 AM",
    location: "Innovation Centre, Floor 2",
    description: "Form teams of 2–4 and build a product in 24 hours around a surprise theme. $5 000 in prizes across three categories. Snacks & mentors provided. Registration includes overnight access, Wi-Fi, and a swag kit.",
    seatsLeft: 8,
    category: "Tech",
    organiserEmail: "hackathon@campus.edu",
    organiserPhone: "+91 93210 76543",
  },
  {
    id: "f10",
    title: "Jazz & Chill Evening",
    date: "Thu, 19 Mar 2026",
    time: "8:00 PM",
    location: "Black Box Theatre",
    description: "The Campus Jazz Ensemble performs a two-hour set of classics and originals. Free with student card. Bar open from 7 PM. Featuring guest saxophonist Rohan Mehta and the 12-piece Campus Big Band.",
    seatsLeft: 60,
    category: "Music",
    organiserEmail: "musicclub@campus.edu",
    organiserPhone: "+91 99887 76655",
  },
  {
    id: "f11",
    title: "Intramural Basketball Tournament",
    date: "Fri, 20 Mar 2026",
    time: "10:00 AM",
    location: "Sports Centre — Court 1 & 2",
    description: "Register your team of 5 for the annual on-campus basketball showdown. Trophy and cash prize for the winners. Individual sign-ups welcomed — we'll form balanced teams. Referee-officiated matches, playoffs format.",
    seatsLeft: 48,
    category: "Sports",
    organiserEmail: "sportscommittee@campus.edu",
    organiserPhone: "+91 97654 32109",
  },
  {
    id: "f12",
    title: "Live Mural Painting — Community Art Day",
    date: "Sat, 21 Mar 2026",
    time: "10:00 AM",
    location: "Creative Arts Building — East Wall",
    description: "10 student artists transform the east wall into a 30-metre mural themed 'What's Next'. Paint, brushes, and gloves provided. Come help! No experience necessary — there's a section for everyone to contribute a stroke.",
    seatsLeft: 35,
    category: "Art",
    organiserEmail: "artclub@campus.edu",
    organiserPhone: "+91 96321 09876",
  },
  {
    id: "f13",
    title: "Startup Pitch Night",
    date: "Wed, 25 Mar 2026",
    time: "6:00 PM",
    location: "Business School, Auditorium",
    description: "Eight student-led startups pitch to a panel of VCs and campus advisors. Dragons' Den energy, campus vibes. Audience vote picks the wildcard winner. Networking reception with investors follows the main event.",
    seatsLeft: 120,
    category: "Career",
    organiserEmail: "entrepreneurcell@campus.edu",
    organiserPhone: "+91 92109 65432",
  },
  {
    id: "f14",
    title: "Night Sky Stargazing Session",
    date: "Thu, 26 Mar 2026",
    time: "9:00 PM",
    location: "Observatory Hill, Campus Grounds",
    description: "Astronomy Society hosts a guided stargazing night with 4 telescopes. Spot Jupiter, the Orion Nebula, and more. Hot chocolate included. ☕ Dress warmly. Red-light torches provided to preserve night vision.",
    seatsLeft: 40,
    category: "Tech",
    organiserEmail: "astronomysoc@campus.edu",
    organiserPhone: "+91 91098 54321",
  },
  {
    id: "f15",
    title: "Cooking Masterclass: Ramen from Scratch",
    date: "Sat, 28 Mar 2026",
    time: "3:00 PM",
    location: "Home Ec Kitchen, Building D",
    description: "Learn to cook authentic tonkotsu ramen broth, hand-cut noodles, and toppings from scratch. You eat what you cook. Only 16 spots! All ingredients provided. Aprons and recipe cards to take home.",
    seatsLeft: 7,
    category: "Food",
    organiserEmail: "foodclub@campus.edu",
    organiserPhone: "+91 90987 43210",
  },
  {
    id: "f16",
    title: "End-of-Term Rooftop DJ Party",
    date: "Tue, 31 Mar 2026",
    time: "7:00 PM",
    location: "Student Union Rooftop",
    description: "Close out March dancing under the stars. Three DJs, two floors, one massive celebration. Tickets selling fast — grab yours before they're gone! 🎶 ID required at entry. Student card gets you a free welcome drink.",
    seatsLeft: 12,
    category: "Music",
    organiserEmail: "studentunion@campus.edu",
    organiserPhone: "+91 89876 54321",
  },
];

// ---------------------------------------------------------------------------
// ICS (Add to Calendar) helper
// ---------------------------------------------------------------------------
function buildICS(event) {
  const { title, date, time, location, description } = event;

  // Parse date string e.g. "Wed, 4 Mar 2026"
  const parsedDate = new Date(date);
  const y = parsedDate.getFullYear();
  const mo = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const d = String(parsedDate.getDate()).padStart(2, "0");

  // Parse time string e.g. "10:00 AM" / "7:00 PM"
  const [timePart, period] = time.split(" ");
  let [h, m] = timePart.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  const pad = (n) => String(n).padStart(2, "0");
  const dtStart = `${y}${mo}${d}T${pad(h)}${pad(m)}00`;
  const dtEnd   = `${y}${mo}${d}T${pad(h + 2)}${pad(m)}00`; // assume 2-hr duration

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WhatsUp Campus Events//EN",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/[\r\n]+/g, "\\n")}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// ---------------------------------------------------------------------------
// Event Detail Modal
// ---------------------------------------------------------------------------
function EventDetailModal({ event, onClose, onBook, isBooked }) {
  const { title, date, time, location, description, seatsLeft, category, image, organiserEmail, organiserPhone } = event;
  const isSoldOut = seatsLeft === 0;

  const categoryStyles = {
    Tech:   "bg-indigo-100 text-indigo-700",
    Music:  "bg-purple-100 text-purple-700",
    Career: "bg-sky-100 text-sky-700",
    Sports: "bg-green-100 text-green-700",
    Art:    "bg-pink-100 text-pink-700",
    Food:   "bg-orange-100 text-orange-700",
  };
  const pillStyle = categoryStyles[category] ?? "bg-slate-100 text-slate-600";

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  // Prevent background scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Banner */}
        <div className="relative h-48 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
          {image ? (
            <img src={image} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-8xl opacity-20 select-none">🎓</div>
          )}
          <div className="absolute left-4 top-4">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pillStyle}`}>{category}</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 p-6">
          <h2 className="text-2xl font-extrabold leading-snug text-slate-900">{title}</h2>

          {/* Meta */}
          <div className="flex flex-col gap-2 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="text-base">📅</span>
              <span>{date} &middot; {time}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <span>{location}</span>
            </div>
          </div>

          {/* Full description */}
          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">About this event</h3>
            <p className="text-sm leading-relaxed text-slate-700">{description}</p>
          </div>

          {/* Organiser's Info */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Organiser&apos;s Info</h3>
            <div className="flex flex-col gap-2">
              {organiserEmail ? (
                <a
                  href={`mailto:${organiserEmail}`}
                  className="flex items-center gap-3 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-base">✉️</span>
                  <span>{organiserEmail}</span>
                </a>
              ) : (
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-base">✉️</span>
                  <span>Email not provided</span>
                </div>
              )}
              {organiserPhone ? (
                <a
                  href={`tel:${organiserPhone}`}
                  className="flex items-center gap-3 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-base">📞</span>
                  <span>{organiserPhone}</span>
                </a>
              ) : (
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-base">📞</span>
                  <span>Phone not provided</span>
                </div>
              )}
            </div>
          </div>

          {/* Seats + Book */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">
              {isSoldOut ? (
                <span className="font-semibold text-slate-500">😔 Sold Out</span>
              ) : seatsLeft <= 10 ? (
                <span className="font-semibold text-red-600">🔥 Only {seatsLeft} seats left!</span>
              ) : seatsLeft <= 25 ? (
                <span className="font-semibold text-amber-600">⚡ {seatsLeft} seats remaining</span>
              ) : (
                <span className="font-semibold text-emerald-600">✅ {seatsLeft} seats available</span>
              )}
            </div>
            <button
              onClick={() => { if (!isSoldOut && !isBooked) { onBook(event); onClose(); } }}
              disabled={isSoldOut || isBooked}
              className={`rounded-xl px-6 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                ${isSoldOut
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : isBooked
                  ? "cursor-default bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                  : "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 active:scale-95"
                }`}
            >
              {isSoldOut ? "Sold Out" : isBooked ? "✓ Booked" : "Book Seat →"}
            </button>
          </div>

          {/* Add to Calendar */}
          <a
            href={`data:text/calendar;charset=utf-8,${encodeURIComponent(buildICS(event))}`}
            download={`${title.replace(/[^a-z0-9]/gi, "_")}.ics`}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
          >
            <span>📅</span> Add to Calendar
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header Component
// ---------------------------------------------------------------------------
function Header({ searchQuery, onSearchChange, user, onLoginClick, onLogout }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        {/* Row 1: Logo + Auth buttons */}
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-xl shadow-sm">
              🎓
            </div>
            <div className="leading-tight">
              <span className="block text-lg font-extrabold tracking-tight text-slate-900">
                What&apos;s{" "}
                <span className="text-indigo-600">Up</span>
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-widest text-slate-400">
                Campus Events
              </span>
            </div>
          </div>

          {/* Nav actions — always visible */}
          <nav className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden max-w-[180px] truncate text-sm text-slate-500 sm:block">{user.email}</span>
                <button
                  onClick={onLogout}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-red-300 hover:text-red-600 sm:px-4 sm:py-2"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onLoginClick("login")}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 sm:px-4 sm:py-2"
                >
                  Log In
                </button>
                <button
                  onClick={() => onLoginClick("signup")}
                  className="rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95 sm:px-4 sm:py-2"
                >
                  Sign Up
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Row 2: Search bar — full width */}
        <div className="relative mt-2.5">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            🔍
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events, categories…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:max-w-md"
          />
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Hero Banner Component
// ---------------------------------------------------------------------------
function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-4 py-14 text-center sm:px-6 lg:px-8">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-purple-800/20 blur-3xl" />

      <div className="relative mx-auto max-w-2xl">
        <span className="mb-3 inline-block rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white/90">
          🗓️ March 2026 — Events Live
        </span>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          Discover what&apos;s happening <br className="hidden sm:block" />
          <span className="text-yellow-300">on campus</span>
        </h1>
        <p className="mt-4 text-base text-indigo-100 sm:text-lg">
          From hackathons to acoustic nights — find events you&apos;ll actually want to go to.
          Book your seat before it&apos;s gone. 🚀
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------
function EmptyState({ query }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <span className="text-5xl">🔎</span>
      <h3 className="text-lg font-semibold text-slate-700">No events found</h3>
      <p className="text-sm text-slate-500">
        No results for <strong>&ldquo;{query}&rdquo;</strong>. Try a different keyword or category.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast Notification
// ---------------------------------------------------------------------------
function Toast({ message, onClose }) {
  const isError   = message.toLowerCase().startsWith("booking failed") ||
                    message.toLowerCase().startsWith("booking saved");
  const isWarning = message.startsWith("You've already");
  const isLogout  = message.startsWith("You have been logged out");

  const icon = isError ? "⚠️" : isWarning ? "ℹ️" : isLogout ? "👋" : "🎉";

  const bg = isError
    ? "bg-red-700"
    : isWarning
    ? "bg-amber-600"
    : "bg-slate-900";

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl ${bg} px-5 py-3.5 text-sm font-medium text-white shadow-2xl animate-in slide-in-from-bottom-4`}>
      <span>{icon}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white/60 hover:text-white">✕</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App (Root Component)
// ---------------------------------------------------------------------------
export default function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  // Auth state
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState("login");
  const [pendingEvent, setPendingEvent] = useState(null);

  // Set of event IDs the current user has already booked
  const [bookedEventIds, setBookedEventIds] = useState(new Set());

  // Selected event for detail modal
  const [selectedEvent, setSelectedEvent] = useState(null);

  // My Bookings toggle
  const [showMyBookings, setShowMyBookings] = useState(false);

  // ------------------------------------------------------------------
  // Fetch all events from Supabase on mount, ordered by date ascending
  // ------------------------------------------------------------------
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);

      const { data, error: sbError } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

      if (sbError) {
        // Supabase unavailable — use fallback demo events so the UI stays busy
        setEvents(FALLBACK_EVENTS);
      } else if (!data || data.length === 0) {
        // No events in the database yet — show demo events
        setEvents(FALLBACK_EVENTS);
      } else {
        setEvents(data.map(mapEvent));
      }
      setLoading(false);
    }

    fetchEvents();
  }, []);

  // ------------------------------------------------------------------
  // Auth – restore session on mount and listen for changes
  // ------------------------------------------------------------------
  useEffect(() => {
    // Restore existing session (page reload)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ------------------------------------------------------------------
  // Fetch the user's existing bookings whenever they log in / out
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!user) {
      setBookedEventIds(new Set());
      return;
    }
    async function fetchUserBookings() {
      const { data, error: sbError } = await supabase
        .from("bookings")
        .select("event_id")
        .eq("user_id", user.id);

      if (!sbError && data) {
        setBookedEventIds(new Set(data.map((row) => row.event_id)));
      }
    }
    fetchUserBookings();
  }, [user]);

  // ------------------------------------------------------------------
  // Client-side search filter (no extra round-trip to Supabase)
  // ------------------------------------------------------------------
  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  const displayedEvents = useMemo(() => {
    if (!showMyBookings) return filteredEvents;
    return filteredEvents.filter((e) => bookedEventIds.has(e.id));
  }, [filteredEvents, showMyBookings, bookedEventIds]);

  // ------------------------------------------------------------------
  // Book a seat:
  //   1. Optimistically decrement seatsLeft in local state (instant UI)
  //   2. Call the `book_event_seat` Postgres RPC (atomic, race-safe)
  //   3. Revert local state if the RPC fails
  // ------------------------------------------------------------------
  const handleBook = useCallback(async (event) => {
    // ── Guard: no seats left ─────────────────────────────────────────
    if (event.seatsLeft <= 0) return;

    // ── Guard: must be logged in ─────────────────────────────────────
    if (!user) {
      setPendingEvent(event);
      setShowAuthModal(true);
      return;
    }

    // ── Guard: already booked (client-side fast-path) ────────────────
    if (bookedEventIds.has(event.id)) {
      setToast(`You've already booked "${event.title}".`);
      setTimeout(() => setToast(null), 3500);
      return;
    }

    // ── Demo events (string IDs f1…) — no DB work ───────────────────
    const isFallback = typeof event.id === "string" && event.id.startsWith("f");
    if (isFallback) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, seatsLeft: e.seatsLeft - 1 } : e
        )
      );
      setBookedEventIds((prev) => new Set([...prev, event.id]));
      setToast(`Booking confirmed for "${event.title}"! 🎉`);
      setTimeout(() => setToast(null), 4000);
      return;
    }

    // ── 1. Optimistic UI update ───────────────────────────────────────
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id ? { ...e, seatsLeft: e.seatsLeft - 1 } : e
      )
    );
    setBookedEventIds((prev) => new Set([...prev, event.id]));

    // ── 2. Insert booking row (unique constraint catches duplicates) ──
    const { error: bookingError } = await supabase
      .from("bookings")
      .insert({ event_id: event.id, user_id: user.id });

    if (bookingError) {
      // Unique-violation code = "23505" — already booked
      const alreadyBooked = bookingError.code === "23505";
      // Revert optimistic update
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, seatsLeft: e.seatsLeft + 1 } : e
        )
      );
      setBookedEventIds((prev) => {
        const next = new Set(prev);
        if (!alreadyBooked) next.delete(event.id); // keep if truly already booked
        return next;
      });
      setToast(
        alreadyBooked
          ? `You've already booked "${event.title}".`
          : `Booking failed: ${bookingError.message}`
      );
      setTimeout(() => setToast(null), 4000);
      return;
    }

    // ── 3. Atomically decrement seats_left via RPC ────────────────────
    const { error: rpcError } = await supabase.rpc("book_event_seat", {
      event_id: event.id,
    });

    if (rpcError) {
      // Revert UI — seat count back up (booking row already inserted;
      // the unique constraint means a retry won't double-insert)
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, seatsLeft: e.seatsLeft + 1 } : e
        )
      );
      setToast(`Booking saved but seat count update failed: ${rpcError.message}`);
      setTimeout(() => setToast(null), 4000);
      return;
    }

    // ── 4. All done ───────────────────────────────────────────────────
    setToast(`Booking confirmed for "${event.title}"! 🎉`);
    setTimeout(() => setToast(null), 4000);
  }, [user, bookedEventIds]);

  // ------------------------------------------------------------------
  // Auth callbacks
  // ------------------------------------------------------------------
  const handleAuthSuccess = useCallback((loggedInUser) => {
    setUser(loggedInUser);
    setShowAuthModal(false);
    // If the user opened auth to book a specific event, complete it now
    if (pendingEvent) {
      const eventToBook = pendingEvent;
      setPendingEvent(null);
      // Small delay so the modal finishes closing
      setTimeout(() => handleBook(eventToBook), 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEvent]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowMyBookings(false);
    setToast("You have been logged out.");
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        user={user}
        onLoginClick={(tab = "login") => { setAuthInitialTab(tab); setShowAuthModal(true); }}
        onLogout={handleLogout}
      />
      <HeroBanner />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="mb-4 flex items-center justify-between gap-3">
          {/* Tabs: All Events / My Bookings */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setShowMyBookings(false)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition
                ${!showMyBookings ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
            >
              All Events
            </button>
            <button
              onClick={() => {
                if (!user) { setAuthInitialTab("login"); setShowAuthModal(true); return; }
                setShowMyBookings(true);
              }}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition
                ${showMyBookings ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
            >
              My Bookings
              {user && bookedEventIds.size > 0 && (
                <span className="ml-1.5 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {bookedEventIds.size}
                </span>
              )}
            </button>
          </div>
          <p className="text-sm text-slate-500 shrink-0">
            {loading ? "Loading…" : `${displayedEvents.length} event${displayedEvents.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Category filter pills — scrollable on mobile */}
        {!showMyBookings && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {["All", "Tech", "Music", "Career", "Sports", "Art", "Food"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSearchQuery(cat === "All" ? "" : cat)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition
                  ${(cat === "All" && searchQuery === "") || searchQuery.toLowerCase() === cat.toLowerCase()
                    ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            ⚠️ Could not load events: {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : showMyBookings && displayedEvents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="text-5xl">🎟️</span>
            <h3 className="text-lg font-semibold text-slate-700">No bookings yet</h3>
            <p className="text-sm text-slate-500">
              You haven&apos;t booked any events. Browse and grab a seat!
            </p>
            <button
              onClick={() => setShowMyBookings(false)}
              className="mt-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Browse Events
            </button>
          </div>
        ) : displayedEvents.length === 0 ? (
          <EmptyState query={searchQuery} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onBook={handleBook}
                isBooked={bookedEventIds.has(event.id)}
                onCardClick={setSelectedEvent}
              />
            ))}
          </div>
        )}
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onBook={handleBook}
          isBooked={bookedEventIds.has(selectedEvent.id)}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => { setShowAuthModal(false); setPendingEvent(null); }}
          onSuccess={handleAuthSuccess}
          initialTab={authInitialTab}
        />
      )}
    </div>
  );
}

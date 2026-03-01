import { useState, useMemo, useEffect, useCallback } from "react";
import EventCard from "./components/EventCard";
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
  };
}

// ---------------------------------------------------------------------------
// Header Component
// ---------------------------------------------------------------------------
function Header({ searchQuery, onSearchChange }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
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

        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            🔍
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events, categories…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Nav actions */}
        <nav className="hidden items-center gap-3 sm:flex">
          <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600">
            Log In
          </button>
          <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95">
            Sign Up
          </button>
        </nav>
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
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-medium text-white shadow-2xl animate-in slide-in-from-bottom-4">
      <span>🎉</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white">✕</button>
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
        setError(sbError.message);
      } else {
        setEvents((data ?? []).map(mapEvent));
      }
      setLoading(false);
    }

    fetchEvents();
  }, []);

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

  // ------------------------------------------------------------------
  // Book a seat:
  //   1. Optimistically decrement seatsLeft in local state (instant UI)
  //   2. Call the `book_event_seat` Postgres RPC (atomic, race-safe)
  //   3. Revert local state if the RPC fails
  // ------------------------------------------------------------------
  const handleBook = useCallback(async (event) => {
    if (event.seatsLeft <= 0) return;

    // 1. Optimistic update — card reflects new count immediately
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id ? { ...e, seatsLeft: e.seatsLeft - 1 } : e
      )
    );

    // 2. Persist to Supabase via atomic RPC
    const { error: sbError } = await supabase.rpc("book_event_seat", {
      event_id: event.id,
    });

    // 3. Revert on failure and notify user
    if (sbError) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, seatsLeft: e.seatsLeft + 1 } : e
        )
      );
      setToast(`Booking failed: ${sbError.message}`);
    } else {
      setToast(`You've booked a seat for "${event.title}"! 🎉`);
    }
    setTimeout(() => setToast(null), 4000);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <HeroBanner />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Upcoming Events</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading
                ? "Loading…"
                : `${filteredEvents.length} event${
                    filteredEvents.length !== 1 ? "s" : ""
                  } found`}
            </p>
          </div>
          {/* Quick-filter pills */}
          <div className="hidden items-center gap-2 sm:flex flex-wrap">
            {["All", "Tech", "Music", "Career", "Sports", "Art"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSearchQuery(cat === "All" ? "" : cat)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition
                  ${
                    (cat === "All" && searchQuery === "") ||
                    searchQuery.toLowerCase() === cat.toLowerCase()
                      ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

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
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState query={searchQuery} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} onBook={handleBook} />
            ))}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

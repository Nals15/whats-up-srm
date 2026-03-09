const SCARCITY_THRESHOLDS = {
  critical: 10,  // <= 10 seats: red/fire
  low: 25,       // <= 25 seats: orange/warning
};

function ScarcityBadge({ seatsLeft }) {
  if (seatsLeft <= SCARCITY_THRESHOLDS.critical) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
        🔥 Only {seatsLeft} seats left!
      </span>
    );
  }
  if (seatsLeft <= SCARCITY_THRESHOLDS.low) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
        ⚡ {seatsLeft} seats remaining
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
      ✅ {seatsLeft} seats available
    </span>
  );
}

function CategoryPill({ category }) {
  const styles = {
    Tech:      "bg-indigo-100 text-indigo-700",
    Music:     "bg-purple-100 text-purple-700",
    Career:    "bg-sky-100 text-sky-700",
    Sports:    "bg-green-100 text-green-700",
    Art:       "bg-pink-100 text-pink-700",
    Food:      "bg-orange-100 text-orange-700",
  };
  const base = styles[category] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${base}`}>
      {category}
    </span>
  );
}

export default function EventCard({ event, onBook, isBooked = false, onCardClick }) {
  const { title, date, time, location, description, seatsLeft, category, image } = event;

  const isSoldOut = seatsLeft === 0;

  return (
    <article
      onClick={() => onCardClick?.(event)}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-indigo-300 cursor-pointer"
    >
      {/* Card Image / Banner */}
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl opacity-30 select-none">
            🎓
          </div>
        )}
        {/* Category pill overlay */}
        <div className="absolute left-3 top-3">
          <CategoryPill category={category} />
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Title */}
        <h2 className="line-clamp-2 text-lg font-bold leading-snug text-slate-800 group-hover:text-indigo-600 transition-colors duration-200">
          {title}
        </h2>

        {/* Date / Time / Location */}
        <div className="flex flex-col gap-1 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-base">📅</span>
            <span>{date} &middot; {time}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">📍</span>
            <span>{location}</span>
          </div>
        </div>

        {/* Description */}
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
          {description}
        </p>

        {/* Scarcity Badge */}
        <div>
          {isSoldOut ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
              😔 Sold Out
            </span>
          ) : (
            <ScarcityBadge seatsLeft={seatsLeft} />
          )}
        </div>

        {/* Book Seat Button */}
        <button
          onClick={(e) => { e.stopPropagation(); !isSoldOut && !isBooked && onBook?.(event); }}
          disabled={isSoldOut || isBooked}
          className={`mt-1 w-full rounded-xl py-2.5 text-sm font-semibold tracking-wide transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
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
    </article>
  );
}

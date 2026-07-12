export default function DiscoverLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-3xl font-medium tracking-tight text-ink">Discover</h1>
      <p className="mt-1 text-sm text-ink/60">
        Searching the boutiques — picking stores, pulling catalogs, styling the results…
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-xl bg-white ring-1 ring-bone">
            <div className="h-56 bg-bone/50" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-3/4 rounded bg-bone/70" />
              <div className="h-3 w-1/2 rounded bg-bone/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

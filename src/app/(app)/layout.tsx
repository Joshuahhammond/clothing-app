import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import type { Profile } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard", short: "Home" },
  { href: "/clients", label: "Clients", short: "Clients" },
  { href: "/items", label: "Item library", short: "Library" },
  { href: "/discover", label: "Discover ✦", short: "Discover" },
  { href: "/lookbooks", label: "Lookbooks", short: "Looks" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-bone bg-white md:flex">
        <Link href="/dashboard" className="px-5 py-5 text-lg font-bold tracking-tight text-ink">
          hammy
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-ink/80 hover:bg-bone/60 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-bone px-5 py-4">
          <p className="truncate text-sm font-medium text-ink">
            {profile?.full_name || user.email}
          </p>
          {profile?.business_name && (
            <p className="truncate text-xs text-ink/60">{profile.business_name}</p>
          )}
          <form action={signOut} className="mt-2">
            <button type="submit" className="text-xs font-medium text-ink/60 hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-bone bg-white px-4 py-3 md:hidden">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight text-ink">
            hammy
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-xs font-medium text-ink/60">
              Sign out
            </button>
          </form>
        </header>

        <main className="flex-1 overflow-x-hidden px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-bone bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-3 text-center text-[11px] font-medium uppercase tracking-wide text-ink/70 active:bg-cream"
            >
              {item.short}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addClient } from "./actions";
import type { Client } from "@/lib/types";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  const clients = (data ?? []) as Client[];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold text-stone-900">Clients</h1>

      <form
        action={addClient}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4"
      >
        <div className="min-w-40 flex-1">
          <label htmlFor="name" className="mb-1 block text-xs font-medium text-stone-600">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
          />
        </div>
        <div className="min-w-40 flex-1">
          <label htmlFor="email" className="mb-1 block text-xs font-medium text-stone-600">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Add client
        </button>
      </form>

      {clients.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-500">
          No clients yet — add your first client above.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {clients.map((client) => (
            <li key={client.id}>
              <Link
                href={`/clients/${client.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-stone-50"
              >
                <div>
                  <p className="text-sm font-medium text-stone-900">{client.name}</p>
                  {client.email && <p className="text-xs text-stone-500">{client.email}</p>}
                </div>
                <span className="text-xs text-stone-400">
                  Added {new Date(client.created_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

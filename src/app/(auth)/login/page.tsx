import Link from "next/link";
import { signIn } from "../actions";

type Props = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: Props) {
  const { error, message } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-2xl font-semibold tracking-tight text-teal-700">
          Hueline
        </Link>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-lg font-semibold text-stone-900">Sign in</h1>
          {message && (
            <p className="mb-4 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">{message}</p>
          )}
          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <form action={signIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-stone-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Sign in
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-stone-600">
          New here?{" "}
          <Link href="/signup" className="font-medium text-teal-700 hover:underline">
            Create a stylist account
          </Link>
        </p>
      </div>
    </main>
  );
}

import Link from "next/link";
import { signUp } from "../actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export const metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-2xl font-semibold tracking-tight text-teal-700">
          Hueline
        </Link>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-lg font-semibold text-stone-900">Create your stylist account</h1>
          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <form action={signUp} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-stone-700">
                Your name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="business_name" className="mb-1 block text-sm font-medium text-stone-700">
                Business name <span className="font-normal text-stone-400">(optional)</span>
              </label>
              <input
                id="business_name"
                name="business_name"
                type="text"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
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
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Create account
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-stone-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-teal-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

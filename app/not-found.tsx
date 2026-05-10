import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative z-10 min-h-screen text-gray-900 flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-gray-600">That page doesn&apos;t exist.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-riso-teal text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Back home
      </Link>
    </div>
  );
}

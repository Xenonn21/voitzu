import Link from "next/link";

export default function AuthButtons() {
  return (
    <div className="flex gap-3">
      <Link
        href="/login"
        className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition"
      >
        Login
      </Link>
      <Link
        href="/register"
        className="
          px-4 py-2 rounded-lg text-sm font-medium
          bg-gradient-to-r from-purple-600 to-indigo-600
          hover:from-purple-700 hover:to-indigo-700
          transition
        "
      >
        Register
      </Link>
    </div>
  );
}

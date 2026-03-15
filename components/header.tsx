import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-blue-100 bg-white">
      <div className="mx-auto flex w-full max-w-none items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold text-blue-900 sm:text-2xl">
          <Link href="/">
            March Madness Bracket Builder
          </Link>
        </h1>
        <nav />
      </div>
    </header>
  );
}
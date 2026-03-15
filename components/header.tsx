import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-blue-200 bg-blue-50">
      <div className="mx-auto flex w-full max-w-none items-center justify-between px-6 py-5">
        <h1 className="text-3xl font-bold leading-tight text-blue-900 sm:text-4xl">
          <Link href="/">
            March Madness Bracket Builder
          </Link>
        </h1>
        <nav />
      </div>
    </header>
  );
}
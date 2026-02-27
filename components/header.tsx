

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-900">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">March Madness Bracket Builder</h1>
        <nav>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mx-2">Home</a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mx-2">About</a>
            <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mx-2">Contact</a>
        </nav>
    </header>
  );
}
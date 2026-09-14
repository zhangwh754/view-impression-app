import Link from "next/link";

export default function SiteTabs({
  active,
}: {
  active: "reviews" | "showcase";
}) {
  const tabs = [
    { key: "reviews" as const, label: "观后感", href: "/" },
    { key: "showcase" as const, label: "作品一览", href: "/showcase" },
  ];

  return (
    <nav aria-label="主导航" className="mb-8 border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex gap-6">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active === tab.key ? "page" : undefined}
            className={`-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition ${
              active === tab.key
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

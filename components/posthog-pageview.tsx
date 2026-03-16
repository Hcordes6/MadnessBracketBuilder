"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";

export default function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;

    // Let PostHog attribute the pageview correctly.
    posthog.capture("$pageview", {
      $current_url: window.location.href,
      pathname,
      search,
    });
  }, [posthog, pathname, search]);

  return null;
}

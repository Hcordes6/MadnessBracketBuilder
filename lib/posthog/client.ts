"use client";

import posthog from "posthog-js";

/**
 * Initializes PostHog on the client exactly once.
 *
 * - Web analytics: pageviews are captured separately in `PostHogPageView`.
 * - Session replay: enabled via `session_recording` config (actual recording also depends on
 *   project settings in PostHog).
 */
export function initPostHog(): void {
  if (typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  // posthog-js uses internal flags; guard to avoid double init in dev/HMR.
  const anyPosthog = posthog as unknown as { __loaded?: boolean; __initialized?: boolean };
  if (anyPosthog.__loaded || anyPosthog.__initialized) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    ui_host: "https://us.posthog.com",

    // App Router: we explicitly capture pageviews on route changes.
    capture_pageview: false,
    capture_pageleave: true,

    // Reasonable defaults to reduce profile creation unless you identify users.
    person_profiles: "identified_only",

    // Session replay: privacy-first defaults.
    session_recording: {
      maskAllInputs: true,
    },
  });
}

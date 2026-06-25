"use client";

import { useEffect, useState } from "react";

/** Returns true after the first client render — guards against hydration mismatch. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

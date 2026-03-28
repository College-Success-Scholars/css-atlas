"use client";

import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * When Supabase delivers an implicit invite (tokens in the URL hash), the server
 * never sees `type=invite`. After the browser client establishes the session,
 * redirect to `/auth/set-password` so the user can set a password.
 */
export function InviteFromHashRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    if (pathname.startsWith("/auth/set-password")) return;

    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash || hash.length <= 1) return;

    const params = new URLSearchParams(hash.slice(1));
    if (params.get("type") !== "invite") return;

    const supabase = createClient();

    const go = () => {
      if (redirected.current) return;
      redirected.current = true;
      router.replace("/auth/set-password");
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) go();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  return null;
}

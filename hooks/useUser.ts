"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * The signed-in Supabase user, kept in sync with sign-in and sign-out.
 * With `{ required: true }`, logged-out visitors are sent to /sign-in.
 */
export default function useUser({ required = false } = {}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getUser()
      .then(({ data }) => active && setUser(data.user))
      .finally(() => active && setLoading(false));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (required && !loading && !user) router.push("/sign-in");
  }, [required, loading, user, router]);

  return { user, loading };
}

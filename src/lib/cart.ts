import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, ready };
}

export async function addToCart(userId: string, code: string, name: string) {
  const { data: existing } = await supabase
    .from("demo_requests")
    .select("id")
    .eq("user_id", userId)
    .eq("sample_code", code)
    .eq("status", "cart")
    .maybeSingle();
  if (existing) return "exists" as const;
  const { error } = await supabase
    .from("demo_requests")
    .insert({ user_id: userId, sample_code: code, sample_name: name });
  if (error) throw error;
  return "added" as const;
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  ready: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  adminChecked: boolean;
};

// Keep a single context instance across hot reloads.
const g = globalThis as unknown as { __alAdeelAuthCtx?: React.Context<AuthCtx | null> };
const AuthContext = g.__alAdeelAuthCtx ?? (g.__alAdeelAuthCtx = createContext<AuthCtx | null>(null));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;

  useEffect(() => {
    let active = true;
    if (!userId) {
      setRoles([]);
      setAdminChecked(true);
      return;
    }
    setAdminChecked(false);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (!active) return;
        setRoles((data ?? []).map((r) => r.role));
        setAdminChecked(true);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const value = useMemo<AuthCtx>(
    () => ({
      session,
      user: session?.user ?? null,
      ready,
      isAdmin: roles.includes("admin"),
      isStaff: roles.includes("staff"),
      adminChecked,
    }),
    [session, ready, roles, adminChecked],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuthCtx(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useAuth() {
  const { session, user, ready } = useAuthCtx();
  return { session, user, ready };
}

export function useIsAdmin(_userId?: string) {
  const { isAdmin, isStaff, adminChecked } = useAuthCtx();
  return { isAdmin, isStaff, checked: adminChecked };
}

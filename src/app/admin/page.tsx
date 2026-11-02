"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { IS_CONFIGURED } from "@/lib/config";
import { supabaseBrowser } from "@/lib/supabase";
import SetupNotice from "@/components/SetupNotice";
import OrdersAdmin from "@/components/admin/OrdersAdmin";
import ProductsAdmin from "@/components/admin/ProductsAdmin";

type Access = "loading" | "signed-out" | "denied" | "admin";

export default function AdminPage() {
  const [access, setAccess] = useState<Access>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"orders" | "products">("orders");

  const evaluate = useCallback(async (session: Session | null) => {
    if (!session) return setAccess("signed-out");
    // RLS only lets a user read their own row in `admins`, so this is a safe allow-list check.
    // (Real protection is enforced by the database on every query, not by this UI check.)
    const { data } = await supabaseBrowser().from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle();
    setAccess(data ? "admin" : "denied");
  }, []);

  useEffect(() => {
    if (!IS_CONFIGURED) return;
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => evaluate(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      // Defer to avoid calling Supabase inside the auth callback.
      setTimeout(() => evaluate(session), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [evaluate]);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) setError("Sign-in failed. Check your email and password.");
    else setPassword("");
  }

  const signOut = () => supabaseBrowser().auth.signOut();

  if (!IS_CONFIGURED) return <SetupNotice />;
  if (access === "loading") return <div className="mt-10 h-40 animate-pulse rounded-3xl bg-black/5" />;

  if (access === "signed-out") {
    return (
      <div className="mx-auto mt-10 max-w-sm">
        <form onSubmit={signIn} className="card space-y-4 p-7">
          <div>
            <h1 className="text-2xl font-bold">Admin sign in</h1>
            <p className="mt-1 text-sm text-ink-mute">For Ipanz Store administrators only.</p>
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
          {error && <p role="alert" className="rounded-2xl bg-brand-redSoft px-4 py-3 text-sm text-brand-red">{error}</p>}
          <button className="btn-primary btn-lg w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      </div>
    );
  }

  if (access === "denied") {
    return (
      <div className="card mx-auto mt-10 max-w-md p-8 text-center">
        <h1 className="text-xl font-bold">This account isn’t an administrator</h1>
        <p className="mt-2 text-ink-mute">Ask the store owner to authorise your account, then sign in again.</p>
        <button className="btn-secondary mt-5" onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full bg-black/5 p-1" role="tablist">
            {(["orders", "products"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${tab === t ? "bg-white shadow-soft" : "text-ink-mute hover:text-ink"}`}>
                {t}
              </button>
            ))}
          </div>
          <button className="btn-secondary" onClick={signOut}>Sign out</button>
        </div>
      </div>
      {tab === "orders" ? <OrdersAdmin /> : <ProductsAdmin />}
    </div>
  );
}

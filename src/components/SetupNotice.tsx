export default function SetupNotice() {
  return (
    <div className="card mx-auto mt-10 max-w-xl p-8">
      <h1 className="text-xl font-bold">Supabase isn’t connected yet</h1>
      <p className="mt-2 text-ink-mute">
        Set <code className="rounded bg-black/5 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-black/5 px-1">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in{" "}
        <code className="rounded bg-black/5 px-1">.env.local</code> (or in your Vercel project settings), then restart. See the README.
      </p>
    </div>
  );
}

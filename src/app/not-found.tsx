import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md p-10 text-center">
      <h1 className="text-2xl font-bold">We couldn’t find that page</h1>
      <p className="mt-2 text-ink-mute">The product may have been removed or the link is incorrect.</p>
      <Link href="/#shop" className="btn-primary mt-6">Back to shop</Link>
    </div>
  );
}

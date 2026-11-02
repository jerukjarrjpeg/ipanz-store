export default function Notices({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div role="status" className="mb-4 rounded-2xl bg-brand-orangeSoft px-4 py-3 text-sm text-[#8A4600]">
      <ul className="space-y-1">{items.map((n, i) => <li key={i}>{n}</li>)}</ul>
    </div>
  );
}

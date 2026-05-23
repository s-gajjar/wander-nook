export const dynamic = "force-dynamic";

export default function AdminTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-green-600">✅ Admin Dashboard Loaded!</h1>
      <p className="mt-2 text-gray-600">If you see this, auth passed and the layout rendered.</p>
      <p className="mt-4 text-sm text-gray-400">
        DB URL set: {process.env.DATABASE_URL ? "YES (" + process.env.DATABASE_URL.slice(0, 30) + "...)" : "NO ❌"}
      </p>
      <a href="/admin" className="mt-4 inline-block text-blue-600 underline">Go to full dashboard</a>
    </div>
  );
}

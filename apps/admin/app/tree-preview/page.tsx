import AdminTreeView from "@/components/AdminTreeView";

export default function TreePreviewPage() {
  return (
    <main className="min-h-screen bg-panel">
      {/* استدعاء اللوحة الجديدة اللي برمجناها */}
      <AdminTreeView />
    </main>
  );
}
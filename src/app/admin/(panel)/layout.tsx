import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-panel">
      <AdminNav />
      <main className="admin-panel__main">{children}</main>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";

export function AdminNav() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="admin-nav">
      <div className="admin-nav__brand">AI4GC Content Console</div>
      <div className="admin-nav__links" aria-label="Admin description">
        <span className="admin-nav__link admin-nav__link--active">content/ editor</span>
      </div>
      <button type="button" className="admin-button admin-button--ghost" onClick={logout}>
        Log out
      </button>
    </header>
  );
}

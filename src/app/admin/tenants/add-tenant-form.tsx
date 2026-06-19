"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddTenantForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [plan, setPlan] = useState<"free" | "pro" | "enterprise">("free");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subdomain, ownerEmail, plan }),
      });
      if (!res.ok) throw new Error("Failed to create tenant");
      setName("");
      setSubdomain("");
      setOwnerEmail("");
      setPlan("free");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="block text-xs font-medium">Name</label>
        <input
          className="w-full rounded border px-2 py-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium">Subdomain</label>
        <input
          className="w-full rounded border px-2 py-1"
          value={subdomain}
          onChange={(e) => setSubdomain(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium">Owner Email</label>
        <input
          type="email"
          className="w-full rounded border px-2 py-1"
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium">Plan</label>
        <select
          className="w-full rounded border px-2 py-1"
          value={plan}
          onChange={(e) => setPlan(e.target.value as "free" | "pro" | "enterprise")}
        >
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>
      {error && (
        <p className="sm:col-span-2 text-sm text-red-600">{error}</p>
      )}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add Tenant"}
        </button>
      </div>
    </form>
  );
}

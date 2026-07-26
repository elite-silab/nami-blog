import { AdminShell } from "@/components/admin/admin-shell";
export const metadata = { title: { default: "管理后台", template: "%s — Nami Blog Admin" }, robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <AdminShell>{children}</AdminShell>; }

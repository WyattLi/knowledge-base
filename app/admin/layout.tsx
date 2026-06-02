import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminTabs } from "@/components/admin/AdminTabs";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminTabs />
      {children}
    </AdminGuard>
  );
}

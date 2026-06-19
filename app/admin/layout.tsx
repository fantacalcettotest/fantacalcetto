import { requireAdminAccess } from "@/lib/auth/admin.ts";

export const dynamic = "force-dynamic";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireAdminAccess();

  return children;
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { PaymentError } from "@/lib/sepay";
import AdminDashboard from "@/components/features/admin/AdminDashboard";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Quản trị | SmashBook",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof PaymentError && error.status === 401)
      redirect("/login");
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-2xl font-bold">Không thể mở trang quản trị</h1>
        <p className="my-4 text-muted">
          {error instanceof PaymentError
            ? error.message
            : "Không thể kết nối hệ thống. Vui lòng thử lại."}
        </p>
        <Link className="text-court-500 underline" href="/account">
          Về tài khoản
        </Link>
      </main>
    );
  }
  return <AdminDashboard />;
}

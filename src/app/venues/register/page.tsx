"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function RegisterVenuePage() {
  const { user, isLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const form = new FormData(e.currentTarget);
    const values: Record<string, string | number> = Object.fromEntries(
      Array.from(form.entries(), ([key, value]) => [key, String(value)]),
    );
    for (const key of ["lat", "lng", "courts", "hourlyPrice"])
      values[key] = Number(values[key]);
    for (const key of ["openMin", "closeMin"]) {
      const [h, m] = String(values[key]).split(":").map(Number);
      values[key] = h * 60 + m;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/venue-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Không gửi được hồ sơ.");
      setDone(result.venue.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 pb-28">
      <h1 className="text-3xl font-bold">Đăng ký cơ sở sân</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Gửi thông tin để quản trị viên xét duyệt. Cơ sở chỉ xuất hiện và nhận
        đặt sân sau khi được duyệt, với hình thức trả tiền tại sân.
      </p>
      {isLoading ? (
        <p className="mt-8">Đang kiểm tra đăng nhập…</p>
      ) : !user ? (
        <Link
          href="/login"
          className="mt-8 inline-block text-court-500 underline"
        >
          Đăng nhập để gửi hồ sơ
        </Link>
      ) : done ? (
        <div
          role="status"
          className="mt-8 rounded-xl border border-emerald-500/30 p-6"
        >
          <h2 className="font-bold">Đã gửi hồ sơ {done}</h2>
          <p className="mt-2 text-sm">Hồ sơ đang chờ quản trị viên duyệt.</p>
          <Link
            className="mt-4 inline-block text-court-500 underline"
            href="/account"
          >
            Về tài khoản
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            ["name", "Tên cơ sở", "text", "", ""],
            ["phone", "Số điện thoại liên hệ", "tel", "", ""],
            ["address", "Địa chỉ đầy đủ", "text", "", ""],
            ["district", "Quận / huyện", "text", "", ""],
            ["province", "Tỉnh / thành phố", "text", "Hà Nội", ""],
            ["courts", "Số sân", "number", "4", "1"],
            ["lat", "Vĩ độ (latitude)", "number", "", "any"],
            ["lng", "Kinh độ (longitude)", "number", "", "any"],
            ["openMin", "Giờ mở cửa", "time", "06:00", "1800"],
            ["closeMin", "Giờ đóng cửa", "time", "22:00", "1800"],
            ["hourlyPrice", "Giá theo giờ (đồng)", "number", "100000", "1000"],
          ].map(([name, label, type, value, step]) => (
            <label key={name} className="block text-sm">
              {label}
              <input
                required
                name={name}
                type={type}
                defaultValue={value}
                step={step || undefined}
                maxLength={300}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5"
              />
            </label>
          ))}
          <p className="text-xs leading-6 text-muted sm:col-span-2">
            Giá áp dụng cho mọi ngày trong tuần, trong giờ mở cửa. Chọn giờ theo
            mốc 30 phút.
          </p>
          {error && (
            <p role="alert" className="text-sm text-red-500 sm:col-span-2">
              {error}
            </p>
          )}
          <button
            disabled={saving}
            className="rounded-lg bg-court-600 px-5 py-3 font-semibold text-white disabled:opacity-40 sm:col-span-2"
          >
            {saving ? "Đang gửi…" : "Gửi hồ sơ đăng ký"}
          </button>
        </form>
      )}
    </main>
  );
}

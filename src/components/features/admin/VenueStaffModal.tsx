"use client";

import { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, UserPlus, ShieldAlert, CheckCircle2, UserCheck, AlertTriangle } from "lucide-react";

interface VenueStaffMember {
  userId: string;
  name: string;
  phone: string | null;
  email: string | null;
  userRole: string;
  userStatus: string;
  staffRole: "RECEPTIONIST" | "STAFF";
  isActive: boolean;
  assignedAt: string;
  currentShift: {
    id: string;
    startedAt: string;
    note: string | null;
  } | null;
}

interface VenueStaffData {
  venue: {
    id: string;
    name: string;
    status: string;
    ownerId: string;
    owner: {
      name: string;
      phone: string | null;
      email: string | null;
      status: string;
    } | null;
  };
  staffMembers: VenueStaffMember[];
}

interface VenueStaffModalProps {
  venueId: string | null;
  venueName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VenueStaffModal({
  venueId,
  venueName,
  isOpen,
  onClose,
}: VenueStaffModalProps) {
  const [data, setData] = useState<VenueStaffData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Sub-forms state
  const [showAddExisting, setShowAddExisting] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);

  // Form add existing
  const [existingIdentifier, setExistingIdentifier] = useState("");
  const [existingRole, setExistingRole] = useState<"RECEPTIONIST" | "STAFF">("RECEPTIONIST");

  // Form create new
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"RECEPTIONIST" | "STAFF">("RECEPTIONIST");

  // Action state (toggle active)
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionIsActive, setActionIsActive] = useState<boolean>(false);
  const [actionReason, setActionReason] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/venue-staff?venueId=${venueId}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Không tải được dữ liệu nhân sự.");

      const rawStaff: Array<{
        userId: string;
        name: string;
        phone?: string | null;
        email?: string | null;
        userRole?: string;
        userStatus?: string;
        role?: "RECEPTIONIST" | "STAFF";
        isActive?: boolean;
        createdAt?: string;
        isOnShift?: boolean;
      }> = Array.isArray(json.staff)
        ? json.staff
        : Array.isArray(json.staff?.staff)
        ? json.staff.staff
        : Array.isArray(json.staffMembers)
        ? json.staffMembers
        : [];

      const venueInfo = json.venue || json.staff?.venue || {
        id: venueId,
        name: venueName,
        status: "ACTIVE",
        ownerId: "",
        owner: null,
      };

      setData({
        venue: venueInfo,
        staffMembers: rawStaff.map((s) => ({
          userId: s.userId,
          name: s.name,
          phone: s.phone || null,
          email: s.email || null,
          userRole: s.userRole || "STAFF",
          userStatus: s.userStatus || "ACTIVE",
          staffRole: s.role || "RECEPTIONIST",
          isActive: s.isActive ?? true,
          assignedAt: s.createdAt || new Date().toISOString(),
          currentShift: s.isOnShift ? { id: "active", startedAt: new Date().toISOString(), note: null } : null,
        })),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }, [venueId, venueName]);

  useEffect(() => {
    if (isOpen && venueId) {
      loadData();
      setShowAddExisting(false);
      setShowCreateNew(false);
      setMessage("");
      setError("");
    }
  }, [isOpen, venueId, loadData]);

  async function handleToggleActive(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId || !actionUserId || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/venue-staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          userId: actionUserId,
          isActive: actionIsActive,
          reason: actionReason,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Không thể cập nhật quyền nhân viên.");

      setMessage(
        actionIsActive
          ? "Đã kích hoạt lại quyền tại cơ sở thành công."
          : "Đã thu hồi quyền và đóng ca trực tại cơ sở thành công. Tài khoản hệ thống của nhân viên vẫn được bảo toàn."
      );
      setActionUserId(null);
      setActionReason("");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddExisting(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/venue-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          identifier: existingIdentifier,
          role: existingRole,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Không thể thêm nhân viên.");

      setMessage(`Đã thêm nhân viên ${result.staff?.name || existingIdentifier} vào cơ sở.`);
      setExistingIdentifier("");
      setShowAddExisting(false);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateNew(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/venue-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ACCOUNT",
          venueId,
          name: newName,
          phone: newPhone,
          email: newEmail || null,
          password: newPassword,
          role: newRole,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Không thể tạo tài khoản nhân viên.");

      setMessage(`Đã tạo tài khoản và phân quyền cho nhân viên ${newName} thành công.`);
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setNewPassword("");
      setShowCreateNew(false);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between border-b pb-4 dark:border-zinc-800">
            <div>
              <Dialog.Title className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Tài khoản & Quyền vận hành
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-zinc-500">
                Cơ sở: <strong className="text-court-600 font-semibold">{venueName}</strong>
              </Dialog.Description>
            </div>
            <Dialog.Close
              disabled={saving}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            >
              <X size={20} />
            </Dialog.Close>
          </div>

          {/* Banner phân định 3 trạng thái */}
          <div className="my-4 rounded-xl bg-blue-50/70 p-3.5 text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-200 border border-blue-200 dark:border-blue-900/50 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 size={16} /> Chính sách trạng thái độc lập
            </div>
            <p>• <strong>Trạng thái cơ sở:</strong> Cơ sở Hoạt động (ACTIVE) / Đình chỉ (SUSPENDED). Đình chỉ sẽ dừng nhận khách và tạm khóa quyền nhân viên tại cơ sở này.</p>
            <p>• <strong>Trạng thái quyền tại cơ sở:</strong> Hiệu lực / Thu hồi. Thu hồi quyền nhân viên ở đây chỉ có hiệu lực tại cơ sở này, <strong>không</strong> khóa tài khoản hệ thống của nhân viên và <strong>không</strong> ảnh hưởng cơ sở khác.</p>
            <p>• <strong>Trạng thái tài khoản:</strong> ACTIVE / BLOCKED trên toàn hệ thống (chỉ quản lý tại tab Tài khoản).</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
              {message}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-500">Đang tải danh sách nhân sự…</div>
          ) : data ? (
            <div className="space-y-6">
              {/* Thông tin cơ sở & Chủ sân */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
                <div>
                  <span className="text-xs font-semibold uppercase text-zinc-400">Trạng thái cơ sở</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        data.venue.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : data.venue.status === "SUSPENDED"
                          ? "bg-red-500/15 text-red-600 dark:text-red-400"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {data.venue.status === "ACTIVE" ? "Đang hoạt động" : data.venue.status === "SUSPENDED" ? "Tạm ngưng / Đình chỉ" : "Chờ duyệt"}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-zinc-400">Chủ cơ sở (OWNER)</span>
                  <div className="mt-1">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{data.venue.owner?.name || "Chưa có"}</div>
                    <div className="text-xs text-zinc-500">
                      SĐT: {data.venue.owner?.phone || "Chưa có"} · Email: {data.venue.owner?.email || "Chưa có"} · TK:{" "}
                      <span className={data.venue.owner?.status === "ACTIVE" ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
                        {data.venue.owner?.status === "ACTIVE" ? "Hoạt động" : "Bị khóa"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danh sách nhân viên */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Danh sách nhân viên cơ sở ({data.staffMembers.length})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddExisting(true);
                        setShowCreateNew(false);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      <UserCheck size={14} /> Thêm tài khoản có sẵn
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateNew(true);
                        setShowAddExisting(false);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-court-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-court-700"
                    >
                      <UserPlus size={14} /> Tạo tài khoản nhân viên
                    </button>
                  </div>
                </div>

                {/* Form thêm tài khoản có sẵn */}
                {showAddExisting && (
                  <form onSubmit={handleAddExisting} className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-800/40">
                    <h4 className="text-sm font-semibold mb-2">Thêm nhân viên đã có tài khoản vào cơ sở</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-zinc-500 mb-1">Số điện thoại hoặc Email</label>
                        <input
                          required
                          type="text"
                          placeholder="Nhập SĐT hoặc email tài khoản đã có..."
                          value={existingIdentifier}
                          onChange={(e) => setExistingIdentifier(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Vai trò tại cơ sở</label>
                        <select
                          value={existingRole}
                          onChange={(e) => setExistingRole(e.target.value as "RECEPTIONIST" | "STAFF")}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        >
                          <option value="RECEPTIONIST">Lễ tân (Receptionist)</option>
                          <option value="STAFF">Nhân viên trực sân (Staff)</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddExisting(false)}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={saving || !existingIdentifier.trim()}
                        className="rounded-lg bg-court-600 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {saving ? "Đang lưu…" : "Gán vào cơ sở"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Form tạo tài khoản nhân viên mới */}
                {showCreateNew && (
                  <form onSubmit={handleCreateNew} className="mb-4 rounded-xl border border-court-200 bg-court-50/20 p-4 dark:border-court-900 dark:bg-zinc-800/40">
                    <h4 className="text-sm font-semibold mb-2 text-court-700 dark:text-court-400">Tạo mới tài khoản nhân viên</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Họ và tên *</label>
                        <input
                          required
                          type="text"
                          placeholder="Nguyễn Văn A"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Số điện thoại *</label>
                        <input
                          required
                          type="tel"
                          placeholder="0912345678"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Email (không bắt buộc)</label>
                        <input
                          type="email"
                          placeholder="nhanvien@example.com"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Mật khẩu khởi tạo * (tối thiểu 6 ký tự)</label>
                        <input
                          required
                          type="password"
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-zinc-500 mb-1">Vai trò tại cơ sở</label>
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as "RECEPTIONIST" | "STAFF")}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        >
                          <option value="RECEPTIONIST">Lễ tân (Receptionist)</option>
                          <option value="STAFF">Nhân viên trực sân (Staff)</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateNew(false)}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={saving || !newName.trim() || !newPhone.trim() || newPassword.length < 6}
                        className="rounded-lg bg-court-600 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {saving ? "Đang tạo…" : "Tạo & Phân quyền"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Bảng nhân sự */}
                {data.staffMembers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
                    Cơ sở chưa có nhân viên nào được phân công.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50">
                        <tr>
                          <th className="px-4 py-3">Nhân viên</th>
                          <th className="px-4 py-3">Vai trò tại sân</th>
                          <th className="px-4 py-3">Quyền tại cơ sở</th>
                          <th className="px-4 py-3">TK Hệ thống</th>
                          <th className="px-4 py-3">Ca trực</th>
                          <th className="px-4 py-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {data.staffMembers.map((s) => (
                          <tr key={s.userId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                            <td className="px-4 py-3">
                              <div className="font-medium text-zinc-900 dark:text-zinc-100">{s.name}</div>
                              <div className="text-xs text-zinc-500">
                                {s.phone || "Không có SĐT"} {s.email ? `· ${s.email}` : ""}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                {s.staffRole === "RECEPTIONIST" ? "Lễ tân" : "Nhân viên sân"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  s.isActive
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : "bg-red-500/15 text-red-600 dark:text-red-400"
                                }`}
                              >
                                {s.isActive ? "Đang hiệu lực" : "Đã thu hồi / Sa thải"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  s.userStatus === "ACTIVE"
                                    ? "text-zinc-600 dark:text-zinc-400"
                                    : "bg-red-500/15 text-red-600"
                                }`}
                              >
                                {s.userStatus === "ACTIVE" ? "Hoạt động" : "Bị khóa"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {s.currentShift ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                                  Đang trong ca
                                </span>
                              ) : (
                                <span className="text-xs text-zinc-400">Ngoài ca</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {s.isActive ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionUserId(s.userId);
                                    setActionIsActive(false);
                                    setActionReason("");
                                  }}
                                  className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                                >
                                  Thu hồi / Sa thải
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionUserId(s.userId);
                                    setActionIsActive(true);
                                    setActionReason("");
                                  }}
                                  className="rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                >
                                  Kích hoạt lại
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Form xác nhận thu hồi hoặc kích hoạt lại quyền */}
              {actionUserId && (
                <form
                  onSubmit={handleToggleActive}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                    <ShieldAlert size={18} className={actionIsActive ? "text-emerald-600" : "text-amber-600"} />
                    {actionIsActive ? "Xác nhận kích hoạt lại quyền cơ sở" : "Xác nhận thu hồi quyền / sa thải tại cơ sở"}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {actionIsActive
                      ? "Nhân viên sẽ được phép xem dữ liệu và mở ca làm việc tại cơ sở này trở lại."
                      : "Nhân viên sẽ bị đóng ca trực ngay lập tức, bị chặn tất cả API của cơ sở và không còn nhận thông báo mới. Tài khoản toàn hệ thống và quyền ở cơ sở khác không bị ảnh hưởng."}
                  </p>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Lý do thay đổi quyền * (ghi vào nhật ký đối soát)
                    </label>
                    <textarea
                      required
                      minLength={5}
                      maxLength={500}
                      rows={2}
                      placeholder="Ghi rõ lý do thay đổi..."
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setActionUserId(null)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={saving || actionReason.trim().length < 5}
                      className={`rounded-lg px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50 ${
                        actionIsActive ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {saving ? "Đang lưu…" : "Xác nhận cập nhật"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : null}

          <div className="mt-6 flex justify-end border-t pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Đóng
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

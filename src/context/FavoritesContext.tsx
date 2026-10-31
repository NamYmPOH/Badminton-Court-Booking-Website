"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface FavoritesContextType {
  favoriteIds: string[];
  isLoading: boolean;
  isGuest: boolean;
  isFavorite: (venueId: string) => boolean;
  toggleFavorite: (venueId: string, venueName?: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

const GUEST_STORAGE_KEY = "smashbook_guest_favorite_venues";
const LEGACY_STORAGE_KEY = "smashbook_favorite_venues";

function getUserStorageKey(userId: string): string {
  return `smashbook_user_favorites_${userId}`;
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isGuest = !user;
  const inFlightRef = useRef<boolean>(false);

  // Đọc danh sách yêu thích ban đầu tùy theo trạng thái đăng nhập
  const refreshFavorites = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      // Khách vãng lai: Lấy từ localStorage cục bộ
      try {
        let stored = localStorage.getItem(GUEST_STORAGE_KEY);
        // Tương thích ngược: Nếu có key cũ mà chưa có key guest, chuyển sang key guest
        if (!stored) {
          const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (legacy) {
            stored = legacy;
            localStorage.setItem(GUEST_STORAGE_KEY, legacy);
          }
        }
        const parsed: string[] = stored ? JSON.parse(stored) : [];
        setFavoriteIds(Array.isArray(parsed) ? parsed : []);
      } catch {
        setFavoriteIds([]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Đã đăng nhập: Lấy cache của đúng userId trước để UI hiển thị tức thì, sau đó đồng bộ từ server
    try {
      const userKey = getUserStorageKey(user.id);
      const cached = localStorage.getItem(userKey);
      if (cached) {
        const parsed: string[] = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setFavoriteIds(parsed);
        }
      }
    } catch {
      // Bỏ qua lỗi cache
    }

    try {
      const res = await fetch("/api/favorites", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.favoriteVenueIds)) {
        setFavoriteIds(json.favoriteVenueIds);
        try {
          localStorage.setItem(
            getUserStorageKey(user.id),
            JSON.stringify(json.favoriteVenueIds)
          );
        } catch {
          // Bỏ qua lỗi quota bộ nhớ
        }
      }
    } catch (e) {
      console.warn("Không đồng bộ được danh sách yêu thích từ server:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

  const isFavorite = useCallback(
    (venueId: string): boolean => {
      return favoriteIds.includes(venueId);
    },
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (venueId: string, venueName?: string): Promise<boolean> => {
      if (!venueId || inFlightRef.current) return isFavorite(venueId);
      inFlightRef.current = true;

      const currentlyFav = favoriteIds.includes(venueId);
      const willBeFav = !currentlyFav;

      // 1. Cập nhật lạc quan (Optimistic Update)
      const prevIds = [...favoriteIds];
      const nextIds = willBeFav
        ? Array.from(new Set([...favoriteIds, venueId]))
        : favoriteIds.filter((id) => id !== venueId);

      setFavoriteIds(nextIds);

      // 2. Nếu là khách chưa đăng nhập: lưu vào localStorage riêng của khách
      if (!user) {
        try {
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(nextIds));
          if (willBeFav) {
            toast.success(
              venueName
                ? `Đã lưu ${venueName} vào yêu thích (Lưu trên thiết bị này)`
                : "Đã lưu vào danh sách yêu thích (Lưu trên thiết bị này)"
            );
          } else {
            toast.info("Đã bỏ lưu khỏi danh sách yêu thích");
          }
        } catch {
          setFavoriteIds(prevIds);
          toast.error("Không thể ghi nhớ vào trình duyệt.");
        } finally {
          inFlightRef.current = false;
        }
        return willBeFav;
      }

      // 3. Nếu đã đăng nhập: Gọi API server và rollback nếu lỗi
      try {
        localStorage.setItem(getUserStorageKey(user.id), JSON.stringify(nextIds));

        if (willBeFav) {
          const res = await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ venueId }),
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.message || "Lỗi lưu yêu thích");
          }
          toast.success(venueName ? `Đã lưu ${venueName} vào yêu thích` : "Đã lưu vào yêu thích");
        } else {
          const res = await fetch(`/api/favorites?venueId=${encodeURIComponent(venueId)}`, {
            method: "DELETE",
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.message || "Lỗi xóa yêu thích");
          }
          toast.info(venueName ? `Đã bỏ lưu ${venueName}` : "Đã bỏ lưu khỏi yêu thích");
        }
        return willBeFav;
      } catch (err) {
        // Rollback nếu API thất bại
        setFavoriteIds(prevIds);
        try {
          localStorage.setItem(getUserStorageKey(user.id), JSON.stringify(prevIds));
        } catch {}
        toast.error("Không thể cập nhật danh sách yêu thích. Đã khôi phục trạng thái cũ.");
        return currentlyFav;
      } finally {
        inFlightRef.current = false;
      }
    },
    [favoriteIds, user, isFavorite]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        isLoading,
        isGuest,
        isFavorite,
        toggleFavorite,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}

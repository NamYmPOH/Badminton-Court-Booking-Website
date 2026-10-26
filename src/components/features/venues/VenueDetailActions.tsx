"use client";

import { useState, useEffect } from "react";
import { Heart, Share2, Check } from "lucide-react";

interface VenueDetailActionsProps {
  venueId: string;
  venueName: string;
}

const FAVORITES_STORAGE_KEY = "smashbook_favorite_venues";

export function VenueDetailActions({ venueId, venueName }: VenueDetailActionsProps) {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Đồng bộ trạng thái yêu thích từ localStorage sau khi component mount phía client
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.includes(venueId)) {
          setIsFavorite(true);
        }
      }
    } catch {
      // Bỏ qua lỗi parsing nếu localStorage bị vô hiệu hóa
    }
  }, [venueId]);

  const handleToggleFavorite = (): void => {
    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      let list: string[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];

      if (nextState) {
        if (!list.includes(venueId)) list.push(venueId);
      } else {
        list = list.filter((id) => id !== venueId);
      }
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Xử lý an toàn nếu bộ nhớ trình duyệt đầy
    }
  };

  const handleShare = async (): Promise<void> => {
    const url = window.location.href;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback cho môi trường không hỗ trợ Clipboard API hiện đại
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Bỏ qua lỗi sao chép không mong muốn
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Nút chia sẻ liên kết */}
      <div className="relative">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-muted transition hover:border-court-400 hover:bg-court-50 hover:text-court-700 active:scale-95 dark:hover:bg-surface/80"
          aria-label={`Chia sẻ cơ sở ${venueName}`}
          title="Sao chép liên kết cơ sở"
        >
          {isCopied ? (
            <Check size={16} className="text-emerald-600" />
          ) : (
            <Share2 size={16} />
          )}
        </button>

        {isCopied && (
          <span className="absolute -bottom-8 right-0 z-20 whitespace-nowrap rounded bg-ink px-2 py-0.5 text-[11px] font-medium text-white shadow-md animate-in fade-in zoom-in-95">
            Đã sao chép liên kết!
          </span>
        )}
      </div>

      {/* Nút lưu vào danh sách yêu thích */}
      <button
        type="button"
        onClick={handleToggleFavorite}
        className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-muted transition hover:border-court-400 hover:bg-court-50 active:scale-95 dark:hover:bg-surface/80"
        aria-label={isFavorite ? `Bỏ lưu ${venueName}` : `Lưu ${venueName} vào yêu thích`}
        title={isFavorite ? "Bỏ yêu thích" : "Lưu vào yêu thích"}
      >
        <Heart
          size={16}
          className={
            isFavorite
              ? "fill-rose-500 text-rose-500 transition-colors"
              : "text-muted transition-colors hover:text-rose-500"
          }
        />
      </button>
    </div>
  );
}

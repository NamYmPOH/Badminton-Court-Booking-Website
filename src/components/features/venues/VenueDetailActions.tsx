"use client";

import { useState } from "react";
import { Heart, Share2, Check } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";

interface VenueDetailActionsProps {
  venueId: string;
  venueName: string;
}

export function VenueDetailActions({ venueId, venueName }: VenueDetailActionsProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(venueId);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleToggleFavorite = async (): Promise<void> => {
    await toggleFavorite(venueId, venueName);
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
        aria-label={fav ? `Bỏ lưu ${venueName}` : `Lưu ${venueName} vào yêu thích`}
        aria-pressed={fav}
        title={fav ? "Bỏ yêu thích" : "Lưu vào yêu thích"}
      >
        <Heart
          size={16}
          className={
            fav
              ? "fill-rose-500 text-rose-500 transition-colors"
              : "text-muted transition-colors hover:text-rose-500"
          }
        />
      </button>
    </div>
  );
}

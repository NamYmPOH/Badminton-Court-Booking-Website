import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchVenueSuggestions } from "@/services/venue.service";

export const dynamic = "force-dynamic";

const searchSchema = z.object({
  q: z.string().min(1, "Từ khóa tìm kiếm tối thiểu 1 ký tự").max(100),
  limit: z.coerce.number().min(1).max(20).default(6),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const limitParam = searchParams.get("limit") || "6";

    if (!q.trim()) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const validation = searchSchema.safeParse({ q, limit: limitParam });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validation.error.issues[0]?.message || "Tham số không hợp lệ",
          },
        },
        { status: 400 }
      );
    }

    const { q: validQ, limit: validLimit } = validation.data;
    const suggestions = await searchVenueSuggestions(validQ, validLimit);

    return NextResponse.json(
      {
        success: true,
        data: suggestions,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SEARCH_FAILED",
          message,
        },
      },
      { status: 500 }
    );
  }
}

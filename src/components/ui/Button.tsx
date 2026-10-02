import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-120 rounded-control disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-court-400 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        /** Nền xanh sân — hành động phụ */
        primary:
          "bg-court-600 text-white hover:bg-court-700 active:bg-court-800",
        /** Nền cam vợt — hành động chính (đặt sân, thanh toán). Chữ dùng court-900 (§9.2) */
        accent:
          "bg-racket-500 text-court-900 hover:bg-racket-600 active:bg-racket-600",
        /** Không nền — hành động phụ trợ */
        ghost:
          "bg-transparent text-ink hover:bg-court-50 dark:hover:bg-surface active:bg-court-100",
        /** Nguy hiểm — huỷ, xoá */
        danger:
          "bg-danger text-white hover:bg-red-700 active:bg-red-800",
        /** Viền — phiên bản outline */
        outline:
          "border border-border bg-transparent text-ink hover:bg-court-50 dark:hover:bg-surface",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

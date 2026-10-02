"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-side providers wrapper.
 * Thêm QueryClientProvider, SessionProvider ở milestone sau.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "!bg-surface !text-ink !border-border",
        }}
        richColors
        closeButton
      />
    </ThemeProvider>
  );
}

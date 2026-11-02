"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <FavoritesProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: "!bg-surface !text-ink !border-border",
            }}
            richColors
            closeButton
          />
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

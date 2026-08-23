import { ProfileProvider } from "@/features/profile/context/ProfileProvider";
import { PopupProvider } from "@/shared/components/feedback/Popup";
import { APP_BRAND } from "@/shared/config/navigation";
import { LanguageProvider } from "@/shared/i18n/LanguageProvider";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_BRAND.name,
  description: "Wedding marketplace untuk merencanakan hari istimewa.",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <LanguageProvider>
          <PopupProvider>
            <ProfileProvider>{children}</ProfileProvider>
          </PopupProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

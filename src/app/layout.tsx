import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PopupProvider } from "@/components/common/Popup";
import { ProfileProvider } from "@/components/providers/ProfileProvider";
import { APP_BRAND } from "@/constants/menu";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_BRAND.name,
  description: "Wedding marketplace untuk merencanakan hari istimewa.",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <PopupProvider>
          <ProfileProvider>{children}</ProfileProvider>
        </PopupProvider>
      </body>
    </html>
  );
}

import { SkipLink } from "@/shared/components/navigation/SkipLink";
import { ProfileProvider } from "@/features/profile/context/ProfileProvider";
import { PopupProvider } from "@/shared/components/feedback/Popup";
import { APP_BRAND } from "@/shared/config/navigation";
import { LanguageProvider } from "@/shared/i18n/LanguageProvider";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { resolveLocale } from "@/shared/i18n/locale";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site");
  return {
    title: APP_BRAND.name,
    description: t("description"),
    icons: {
      icon: APP_BRAND.logo,
      apple: APP_BRAND.logo,
    },
  };
}
export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = resolveLocale(await getLocale());
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body>
        <LanguageProvider
          initialLocale={locale}
          initialMessages={messages as import("@/shared/i18n/catalog").AppMessages}
        >
          <SkipLink />
          <PopupProvider>
            <ProfileProvider>{children}</ProfileProvider>
          </PopupProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

import React from "react";
import { useAuth } from "../auth/Provider";
import { useI18n } from "../i18n";
import { menu, titles, useGo } from "../navigation";
import { Screen, Brand, P, RowLink, Button, useConfirm, Card, styles } from "../components/ui";
import { View } from "react-native";
export function MoreScreen() {
  const { session, logout } = useAuth();
  const { t, locale, toggleLanguage } = useI18n();
  const go = useGo();
  const confirm = useConfirm();
  return (
    <Screen>
      <Brand />
      <Card>
        <P>{session!.user.name}</P>
        <P muted>{session!.user.email}</P>
        <P muted>
          {t(
            session!.user.role === "ADMIN"
              ? "Admin"
              : session!.user.role === "VENDOR"
                ? "Vendor"
                : "Customer",
          )}
        </P>
      </Card>
      <View style={[styles.row, { justifyContent: "space-between" }]}>
        <P>{t("Language")}</P>
        <Button
          title={locale === "id" ? "Indonesia → English" : "English → Indonesia"}
          variant="secondary"
          onPress={() => void toggleLanguage()}
        />
      </View>
      {menu[session!.user.role].map((kind) => (
        <RowLink key={kind} title={t(titles[kind])} onPress={() => go(kind)} />
      ))}
      <Button
        title={t("Sign out")}
        variant="danger"
        onPress={() => confirm(t("Sign out"), () => void logout())}
      />
    </Screen>
  );
}

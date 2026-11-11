import React, { useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowUpRight, Check, FileText, X } from "lucide-react-native";
import { isTermsHeading } from "../../../src/features/terms/content";
import type { TermsDocument } from "../domain/contracts";
import { dateLabel, useI18n } from "../i18n";
import { Button, Card, H2, IconButton, P, colors, styles } from "./ui";
export function Terms({
  document,
  articleOnly = false,
}: {
  document: TermsDocument;
  articleOnly?: boolean;
}) {
  const article = (
    <View style={{ gap: 16 }}>
      {document.content.map((block, index) =>
        block.kind === "paragraph" ? (
          <TermsParagraph key={index} text={block.text ?? ""} />
        ) : (
          <TermsTable key={index} rows={block.rows ?? []} number={index + 1} />
        ),
      )}
    </View>
  );
  if (articleOnly) return article;
  return (
    <Card>
      <H2>{document.title}</H2>
      <P muted>{document.version}</P>
      {article}
    </Card>
  );
}

function TermsParagraph({ text }: { text: string }) {
  const { fontScale } = useWindowDimensions();
  const trimmed = text.trim();
  if (isTermsHeading(trimmed))
    return (
      <View style={{ borderTopWidth: 1, borderColor: colors.line, paddingTop: 18, marginTop: 8 }}>
        <H2>{text}</H2>
      </View>
    );
  if (/^[A-Z]\.\s/.test(trimmed))
    return (
      <Text accessibilityRole="header" style={[styles.text, { fontWeight: "600", marginTop: 8 }]}>
        {text}
      </Text>
    );
  const clause = trimmed.match(/^(\d+(?:\.\d+)+|\([a-z]\))\s*([\s\S]*)$/);
  if (!clause) return <P>{text}</P>;
  return (
    <View
      style={{
        flexDirection: fontScale > 1.4 ? "column" : "row",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <Text
        style={[
          styles.text,
          { color: colors.muted, fontWeight: "600", minWidth: clause[1].length > 4 ? 52 : 40 },
        ]}
      >
        {clause[1]}
      </Text>
      <Text style={[styles.text, { flexShrink: 1, minWidth: 0 }]}>{clause[2]}</Text>
    </View>
  );
}

/** Keep every legal cell visible; narrow screens read each record as labelled fields. */
function TermsTable({ rows, number }: { rows: string[][]; number: number }) {
  const { t } = useI18n();
  const { width, fontScale } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const headers = rows[0] ?? [];
  const columns = rows.reduce((count, row) => Math.max(count, row.length), 0);
  const availableWidth = measuredWidth ?? Math.max(0, width - 40);
  const compact =
    availableWidth / fontScale < 640 || availableWidth / Math.max(1, columns) / fontScale < 180;
  if (!rows.length) return null;
  const header = (column: number) =>
    headers[column] || t("Column {{number}}", { number: column + 1 });
  return (
    <View
      accessibilityLabel={t("Terms table {{number}}", { number })}
      onLayout={({ nativeEvent }) => setMeasuredWidth(nativeEvent.layout.width)}
      style={{
        width: "100%",
        minWidth: 0,
        gap: compact ? 12 : 0,
        borderWidth: compact ? 0 : 1,
        borderColor: colors.line,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {compact ? (
        rows.length === 1 ? (
          <Card>
            {headers.map((cell, column) => (
              <Text key={column} style={styles.label}>
                {cell}
              </Text>
            ))}
          </Card>
        ) : (
          rows.slice(1).map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {Array.from({ length: columns }, (_, column) => (
                <View
                  key={column}
                  style={{
                    padding: 14,
                    gap: 6,
                    backgroundColor: column === 0 ? "#F5F5F4" : colors.paper,
                    borderTopWidth: column === 0 ? 0 : 1,
                    borderColor: colors.line,
                  }}
                >
                  <Text style={[styles.label, { color: colors.muted }]}>{header(column)}</Text>
                  <Text style={styles.text}>{row[column] ?? "—"}</Text>
                </View>
              ))}
            </View>
          ))
        )
      ) : (
        rows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            style={{
              flexDirection: "row",
              backgroundColor: rowIndex === 0 ? "#F5F5F4" : colors.paper,
              borderTopWidth: rowIndex === 0 ? 0 : 1,
              borderColor: colors.line,
            }}
          >
            {Array.from({ length: columns }, (_, column) => (
              <View key={column} style={{ flex: 1, minWidth: 0, padding: 14 }}>
                <Text style={[styles.text, rowIndex === 0 && { fontWeight: "600" }]}>
                  {rowIndex === 0 ? header(column) : (row[column] ?? "—")}
                </Text>
              </View>
            ))}
          </View>
        ))
      )}
    </View>
  );
}

export function TermsDialog({
  document,
  visible,
  description,
  onClose,
  footer,
}: {
  document: TermsDocument;
  visible: boolean;
  description: string;
  onClose?: () => void;
  footer: React.ReactNode;
}) {
  const { t, locale } = useI18n();
  return (
    <Modal
      testID="terms-dialog"
      visible={visible}
      animationType="none"
      presentationStyle="fullScreen"
      onRequestClose={() => onClose?.()}
    >
      <SafeAreaView accessibilityViewIsModal style={{ flex: 1, backgroundColor: colors.paper }}>
        <View style={{ flex: 1, width: "100%", maxWidth: 900, alignSelf: "center" }}>
          <View style={{ padding: 20, gap: 8, borderBottomWidth: 1, borderColor: colors.line }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[styles.label, { color: colors.primary }]}>Plan Your Wedding</Text>
                <H2>{document.title}</H2>
              </View>
              {onClose && (
                <IconButton label={t("Close terms and conditions")} onPress={onClose}>
                  <X size={21} color={colors.ink} />
                </IconButton>
              )}
            </View>
            <P muted>
              {t("Version")} {document.version}
              {document.effectiveAt
                ? ` · ${t("Effective from {{date}}", { date: dateLabel(document.effectiveAt, locale) })}`
                : ""}
            </P>
            <P muted>{description}</P>
          </View>
          <ScrollView
            accessibilityLabel={t("Terms and conditions document")}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
          >
            <Terms document={document} articleOnly />
          </ScrollView>
          <ScrollView
            style={{
              flexGrow: 0,
              maxHeight: "45%",
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderColor: colors.line,
            }}
            contentContainerStyle={{ padding: 16, gap: 12 }}
          >
            {footer}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export function RegistrationTerms({ document }: { document: TermsDocument }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const label = t(
    document.termsType === "VENDOR"
      ? "Vendor terms and conditions"
      : "Customer terms and conditions",
  );
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={t("Open the terms and conditions document")}
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
        style={({ pressed }) => ({
          minHeight: 48,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <FileText size={20} color={colors.primary} />
        <Text style={[styles.text, { flex: 1, fontWeight: "600", color: colors.primary }]}>
          {label}
        </Text>
        <ArrowUpRight size={18} color={colors.primary} />
      </Pressable>
      <TermsDialog
        document={document}
        visible={open}
        onClose={() => setOpen(false)}
        description={t("Read these terms before agreeing and continuing registration.")}
        footer={
          <>
            <Button
              title={t("Back to registration")}
              variant="secondary"
              onPress={() => setOpen(false)}
            />
          </>
        }
      />
    </>
  );
}

export function TermsCheckbox({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  const { t } = useI18n();
  const text = label ?? t("I agree to the terms and conditions");
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={text}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={{
        minHeight: 48,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        paddingVertical: 12,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderWidth: 1,
          borderColor: checked ? colors.primary : "#A8A29E",
          borderRadius: 5,
          backgroundColor: checked ? colors.primary : colors.paper,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        {checked && <Check size={15} color={colors.paper} />}
      </View>
      <Text style={[styles.text, { flex: 1 }]}>{text}</Text>
    </Pressable>
  );
}

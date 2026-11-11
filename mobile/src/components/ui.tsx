import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Eye, EyeOff, ChevronRight } from "lucide-react-native";
import { useI18n, errorKey, dateLabel } from "../i18n";

export const colors = {
  background: "#FAF9F6",
  paper: "#FFFFFF",
  ink: "#292524",
  muted: "#57534E",
  line: "#E7E5E4",
  primary: "#945565",
  soft: "#F8EDF0",
  green: "#047857",
  red: "#B91C1C",
};
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 20,
    paddingBottom: 28,
    gap: 20,
    width: "100%",
    maxWidth: 1040,
    alignSelf: "center",
  },
  card: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  h1: { fontSize: 24, lineHeight: 31, fontWeight: "700", color: colors.ink, letterSpacing: -0.5 },
  h2: { fontSize: 17, lineHeight: 24, fontWeight: "600", color: colors.ink },
  text: { fontSize: 15, lineHeight: 23, color: colors.ink },
  muted: { fontSize: 13, lineHeight: 21, color: colors.muted },
  label: { fontSize: 13, lineHeight: 20, fontWeight: "600", color: colors.ink },
  row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#A8A29E",
    backgroundColor: colors.paper,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: colors.ink,
    fontSize: 15,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.paper,
    flexShrink: 1,
    textAlign: "center",
  },
  link: { color: colors.primary, fontWeight: "600", fontSize: 14 },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.soft,
  },
  error: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 14,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { flexGrow: 1, flexBasis: "44%", minWidth: 125 },
  separator: { height: 1, backgroundColor: colors.line },
});
export function Screen({
  children,
  refreshing = false,
  onRefresh,
  scroll = true,
  top = false,
  contentStyle,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
  top?: boolean;
  contentStyle?: ViewStyle;
}) {
  const { width } = useWindowDimensions();
  const content = [
    styles.content,
    { paddingHorizontal: width < 360 ? 16 : width >= 700 ? 28 : 20 },
    contentStyle,
  ];
  return (
    <SafeAreaView edges={top ? ["top", "bottom"] : ["bottom"]} style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={content}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={content}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function H1({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" style={styles.h1}>
      {children}
    </Text>
  );
}
export function H2({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" style={styles.h2}>
      {children}
    </Text>
  );
}
export function P({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return <Text style={muted ? styles.muted : styles.text}>{children}</Text>;
}
export function Button({
  title,
  onPress,
  busy = false,
  disabled = false,
  variant = "primary",
  icon,
  testID,
  style,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "text" | "onDark";
  icon?: React.ReactNode;
  testID?: string;
  style?: ViewStyle;
}) {
  const color = variant === "secondary" || variant === "text" ? colors.primary : colors.paper;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && {
          backgroundColor: colors.paper,
          borderWidth: 1,
          borderColor: colors.line,
        },
        variant === "text" && { backgroundColor: "transparent", paddingHorizontal: 8 },
        variant === "onDark" && {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: "#FFFFFF80",
        },
        variant === "danger" && { backgroundColor: colors.red },
        { opacity: disabled || busy ? 0.5 : pressed ? 0.75 : 1 },
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={color} /> : icon}
      <Text style={[styles.buttonText, { color }]}>{title}</Text>
    </Pressable>
  );
}
export function Field({
  label,
  required,
  secureTextEntry,
  multiline,
  ...props
}: TextInputProps & { label: string; required?: boolean }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>
        {label}
        {required ? " *" : ""}
      </Text>
      <View style={{ position: "relative" }}>
        <TextInput
          {...props}
          accessibilityLabel={label}
          accessibilityHint={required ? t("This field is required") : undefined}
          style={[
            styles.input,
            focused && { borderColor: colors.primary },
            props.editable === false && { backgroundColor: "#F5F5F4" },
            multiline && { minHeight: 110, textAlignVertical: "top" },
            secureTextEntry && { paddingRight: 52 },
          ]}
          autoCapitalize={props.autoCapitalize ?? "sentences"}
          secureTextEntry={secureTextEntry && !visible}
          multiline={multiline}
          placeholderTextColor={colors.muted}
          selectionColor={colors.primary}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
        />
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(visible ? "Hide password" : "Show password")}
            onPress={() => setVisible(!visible)}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 48,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {visible ? (
              <EyeOff size={20} color={colors.muted} />
            ) : (
              <Eye size={20} color={colors.muted} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}
export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={{
          borderWidth: 1,
          borderRadius: 10,
          borderColor: "#A8A29E",
          backgroundColor: "white",
        }}
      >
        <Picker
          accessibilityLabel={label}
          selectedValue={value}
          onValueChange={(next) => onChange(String(next))}
          style={{ color: colors.ink }}
        >
          {options.map((item) => (
            <Picker.Item key={item.value} value={item.value} label={item.label} />
          ))}
        </Picker>
      </View>
    </View>
  );
}
export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={[styles.row, { justifyContent: "space-between" }]}>
      <Text style={[styles.text, { flex: 1 }]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: "#D6D3D1" }}
        thumbColor={value ? colors.paper : "#F5F5F4"}
      />
    </View>
  );
}
export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const date = value ? new Date(`${value.slice(0, 10)}T12:00:00`) : new Date();
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${dateLabel(value, locale)}`}
        style={styles.input}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.text}>{value ? dateLabel(value, locale) : "—"}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={Number.isNaN(date.getTime()) ? new Date() : date}
          mode="date"
          onChange={(_, selected) => {
            setOpen(Platform.OS === "ios");
            if (selected)
              onChange(
                `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`,
              );
          }}
        />
      )}
    </View>
  );
}
export function Feedback({ error, retry }: { error: unknown; retry?: () => void }) {
  const { t } = useI18n();
  if (!error) return null;
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
      <Text style={[styles.text, { color: colors.red }]}>{t(errorKey(error))}</Text>
      {retry && <Button title={t("Try again")} onPress={retry} variant="secondary" />}
    </View>
  );
}
export function Loading() {
  const { t } = useI18n();
  return (
    <View accessibilityLabel={t("Loading")} style={{ padding: 40, gap: 12 }}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={[styles.muted, { textAlign: "center" }]}>{t("Loading")}</Text>
    </View>
  );
}
export function Empty() {
  const { t } = useI18n();
  return (
    <Card>
      <P muted>{t("No data yet")}</P>
    </Card>
  );
}
export function Badge({ value }: { value: string }) {
  const { t } = useI18n();
  const good = ["PAID", "COMPLETED", "VERIFIED", "ACTIVE", "DONE"].includes(value);
  return (
    <View style={[styles.badge, good && { backgroundColor: "#D1FAE5" }]}>
      <Text
        style={{ color: good ? colors.green : colors.primary, fontSize: 12, fontWeight: "600" }}
      >
        {t(value, { defaultValue: value.replace(/_/g, " ") })}
      </Text>
    </View>
  );
}
export function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.muted}>{label}</Text>
      {typeof value === "string" || typeof value === "number" ? <P>{value}</P> : value}
    </View>
  );
}
export function RowLink({
  title,
  subtitle,
  onPress,
  trailing,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={[styles.card, styles.row]}
    >
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={[styles.text, { fontWeight: "600" }]}>{title}</Text>
        {subtitle && <P muted>{subtitle}</P>}
      </View>
      {trailing ?? <ChevronRight size={18} color={colors.muted} />}
    </Pressable>
  );
}
export function Pagination({
  page,
  total,
  pageSize = 10,
  onChange,
}: {
  page: number;
  total: number;
  pageSize?: number;
  onChange: (page: number) => void;
}) {
  const { t } = useI18n();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <View style={{ gap: 10 }}>
      <P muted>{t("Page {{page}} of {{pages}}", { page, pages })}</P>
      <View style={[styles.row, { justifyContent: "space-between" }]}>
        <Button
          title={t("Previous")}
          variant="secondary"
          disabled={page <= 1}
          onPress={() => onChange(page - 1)}
        />
        <Button
          title={t("Next")}
          variant="secondary"
          disabled={page >= pages}
          onPress={() => onChange(page + 1)}
        />
      </View>
    </View>
  );
}
export function Brand({
  compact = false,
  tagline = false,
}: {
  compact?: boolean;
  tagline?: boolean;
}) {
  const { t } = useI18n();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: compact ? 8 : 10,
        flexShrink: 1,
        minWidth: 0,
      }}
    >
      <View
        style={{
          width: compact ? 34 : 42,
          height: compact ? 34 : 42,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={require("../../assets/brand-mark.png")}
          accessible={false}
          style={{ width: compact ? 48 : 60, height: compact ? 48 : 60 }}
          resizeMode="contain"
        />
      </View>
      <View style={{ flexShrink: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: compact ? 15 : 19,
            lineHeight: compact ? 19 : 25,
            fontWeight: "700",
            color: colors.ink,
          }}
        >
          Plan Your Wedding
        </Text>
        {tagline && (
          <Text style={{ fontSize: 12, lineHeight: 18, color: colors.muted }}>
            {t("Celebrate with confidence")}
          </Text>
        )}
      </View>
    </View>
  );
}
export function IconButton({
  label,
  onPress,
  children,
  active = false,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 48,
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        backgroundColor: active || pressed ? colors.soft : "transparent",
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}
export function useConfirm() {
  const { t } = useI18n();
  return (title: string, onConfirm: () => void, message?: string) =>
    Alert.alert(title, message ?? t("Are you sure?"), [
      { text: t("Cancel"), style: "cancel" },
      { text: t("Confirm"), onPress: onConfirm },
    ]);
}

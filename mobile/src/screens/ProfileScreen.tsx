import React, { useState } from "react";
import { View } from "react-native";
import { useAuth } from "../auth/Provider";
import { useI18n } from "../i18n";
import type { CustomerApiProfile, VendorApiProfile, Account } from "../domain/contracts";
import { ApiError, jsonBody } from "../api/client";
import { useAction, useResource } from "../components/hooks";
import {
  appendFile,
  chooseFile,
  AttachmentButton,
  AttachmentImage,
} from "../components/Attachment";
import {
  Screen,
  Card,
  H1,
  H2,
  P,
  Field,
  Button,
  Badge,
  Loading,
  Feedback,
  Detail,
  Select,
  DateField,
  useConfirm,
} from "../components/ui";

type Profile = Partial<CustomerApiProfile & VendorApiProfile & Account>;
export function ProfileScreen() {
  const { api, session } = useAuth();
  const { t } = useI18n();
  const role = session!.user.role;
  const resource = useResource(async (): Promise<Profile> => {
    try {
      return await api(
        role === "ADMIN"
          ? `/users/${session!.user.id}`
          : `/${role === "VENDOR" ? "vendor" : "customer"}-profile/user/${session!.user.id}`,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404 && role !== "ADMIN") return {};
      throw error;
    }
  }, [api, session!.user.id, role]);
  return (
    <Screen
      onRefresh={() => void resource.reload()}
      refreshing={resource.loading && Boolean(resource.data)}
    >
      <H1>{t(role === "VENDOR" ? "Business profile" : "Profile")}</H1>
      {resource.loading && !resource.data ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        resource.data && (
          <>
            <ProfileForm
              key={`${role}-${resource.data.id ?? "new"}`}
              profile={resource.data}
              reload={resource.reload}
            />
            {role === "VENDOR" && resource.data.id && (
              <VendorCollections
                profile={resource.data as VendorApiProfile}
                reload={resource.reload}
              />
            )}
          </>
        )
      )}
    </Screen>
  );
}
function ProfileForm({ profile, reload }: { profile: Profile; reload: () => Promise<void> }) {
  const { api, session } = useAuth();
  const { t } = useI18n();
  const action = useAction();
  const confirm = useConfirm();
  const role = session!.user.role;
  const fields: Record<string, string> =
    role === "ADMIN"
      ? { fullname: "Full name", email: "Email", phoneNumber: "Phone number" }
      : role === "CUSTOMER"
        ? {
            fullName: "Full name",
            address: "Address",
            province: "Province",
            city: "City",
            weddingDate: "Wedding date",
            weddingLocation: "Wedding location",
            estimatedGuests: "Estimated guests",
            estimatedBudget: "Estimated budget",
          }
        : {
            ownerName: "Owner name",
            businessName: "Business name",
            businessEmail: "Business email",
            businessPhone: "Business phone",
            businessAddress: "Business address",
            province: "Province",
            city: "City",
            description: "Description",
            serviceArea: "Service area",
            categories: "Category",
          };
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.keys(fields).map((key) => {
        const value = profile[key as keyof Profile];
        return [
          key,
          Array.isArray(value)
            ? value.join(", ")
            : value == null
              ? key === "fullname" || key === "fullName"
                ? session!.user.name
                : key === "email" || key === "businessEmail"
                  ? session!.user.email
                  : ""
              : String(value),
        ];
      }),
    ),
  );
  const [saved, setSaved] = useState(false);
  const canEdit =
    role !== "VENDOR" ||
    (profile.active !== false && (profile.isVerified || [1, 4].includes(profile.status ?? 1)));
  async function save(submit = false) {
    setSaved(false);
    if (role === "ADMIN") await api(`/users/${session!.user.id}`, jsonBody(values, "PUT"));
    else {
      const body = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (
          ["estimatedGuests", "estimatedBudget"].includes(key) &&
          value &&
          (!Number.isSafeInteger(Number(value)) || Number(value) < 0)
        )
          throw new Error("INVALID_NUMBER");
        if (key === "categories")
          body.append(
            key,
            JSON.stringify(
              value
                .split(",")
                .map((part) => part.trim())
                .filter(Boolean),
            ),
          );
        else if (value.trim())
          body.append(key, key === "businessEmail" ? value.trim().toLowerCase() : value.trim());
      });
      const type = role === "VENDOR" ? "vendor" : "customer";
      if (submit) {
        if (
          [
            "ownerName",
            "businessName",
            "businessEmail",
            "businessPhone",
            "businessAddress",
            "province",
            "city",
            "serviceArea",
            "categories",
          ].some((key) => !values[key]?.trim()) ||
          !profile.contacts?.some((contact) => contact.active !== false) ||
          !profile.verificationDocuments?.some((document) => document.attachmentId)
        )
          throw new Error("REQUIRED");
        body.append("userId", String(session!.user.id));
        await api("/vendor-profile/submit", { method: "POST", body });
      } else if (profile.id) await api(`/${type}-profile/${profile.id}`, { method: "PUT", body });
      else {
        body.append("userId", String(session!.user.id));
        await api(`/${type}-profile/save-draft`, { method: "POST", body });
      }
    }
    setSaved(true);
    await reload();
  }
  return (
    <Card>
      {role === "VENDOR" && (
        <Badge
          value={
            profile.isVerified
              ? "VERIFIED"
              : ((
                  {
                    1: "DRAFT",
                    2: "PENDING_VERIFICATION",
                    4: "REJECTED",
                    5: "SUSPENDED",
                    6: "INACTIVE",
                  } as Record<number, string>
                )[profile.status ?? 1] ?? "INACTIVE")
          }
        />
      )}
      {profile.rejectReason && <P>{profile.rejectReason}</P>}
      {Object.entries(fields).map(([key, label]) =>
        key === "weddingDate" ? (
          <DateField
            key={key}
            label={t(label)}
            value={values[key].slice(0, 10)}
            onChange={(value) => setValues((current) => ({ ...current, [key]: value }))}
          />
        ) : (
          <Field
            guide={key === "categories" ? "Categories" : label}
            key={key}
            editable={canEdit}
            label={t(label)}
            value={values[key]}
            onChangeText={(value) => setValues((current) => ({ ...current, [key]: value }))}
            keyboardType={
              key.toLowerCase().includes("email")
                ? "email-address"
                : ["estimatedGuests", "estimatedBudget"].includes(key)
                  ? "number-pad"
                  : key.toLowerCase().includes("phone")
                    ? "phone-pad"
                    : "default"
            }
            autoCapitalize={key.toLowerCase().includes("email") ? "none" : "sentences"}
            multiline={["description", "address", "businessAddress"].includes(key)}
          />
        ),
      )}
      {saved && <P>{t("Changes saved")}</P>}
      <Feedback error={action.error} />
      <Button
        title={t("Save")}
        disabled={!canEdit}
        busy={action.busy}
        onPress={() => void action.run(() => save())}
      />
      {role === "VENDOR" && !profile.isVerified && (
        <Button
          title={t("Submit for verification")}
          variant="secondary"
          disabled={!canEdit || !profile.id || action.busy}
          onPress={() =>
            confirm(t("Submit for verification"), () => void action.run(() => save(true)))
          }
        />
      )}
    </Card>
  );
}
function VendorCollections({
  profile,
  reload,
}: {
  profile: VendorApiProfile;
  reload: () => Promise<void>;
}) {
  const { api, session } = useAuth();
  const { t } = useI18n();
  const action = useAction();
  const confirm = useConfirm();
  const [bank, setBank] = useState({ bankName: "", accountNumber: "", accountHolderName: "" });
  const [contactType, setContactType] = useState("WhatsApp");
  const [contactValue, setContactValue] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const canEdit =
    profile.active !== false && (profile.isVerified || [1, 4].includes(profile.status ?? 1));
  const remove = (endpoint: string) =>
    confirm(t("Delete"), () => void action.run(() => api(endpoint, { method: "DELETE" }), reload));
  async function mutate(endpoint: string, body: FormData | Record<string, string>) {
    await api(endpoint, body instanceof FormData ? { method: "POST", body } : jsonBody(body));
    await reload();
  }
  return (
    <>
      <Feedback error={action.error} />
      <Card>
        <H2>{t("Bank accounts")}</H2>
        {profile.bankAccounts
          ?.filter((bank) => bank.active !== false)
          .map((bank) => (
            <View key={bank.id} style={{ gap: 8 }}>
              <P>
                {bank.bankName} · {bank.accountNumber}
              </P>
              <P muted>{bank.accountHolderName}</P>
              {canEdit && (
                <Button
                  title={t("Delete")}
                  variant="secondary"
                  disabled={action.busy}
                  onPress={() => remove(`/bank-accounts/${bank.id}`)}
                />
              )}
            </View>
          ))}
        {canEdit && (
          <>
            {Object.entries({
              bankName: "Bank name",
              accountNumber: "Account number",
              accountHolderName: "Account holder",
            }).map(([key, label]) => (
              <Field
                guide={label}
                key={key}
                label={t(label)}
                value={bank[key as keyof typeof bank]}
                onChangeText={(value) => setBank((previous) => ({ ...previous, [key]: value }))}
                keyboardType={key === "accountNumber" ? "number-pad" : "default"}
              />
            ))}
            <Button
              title={t("Add bank account")}
              busy={action.busy}
              disabled={Object.values(bank).some((value) => !value.trim())}
              onPress={() =>
                void action.run(
                  () => mutate(`/bank-accounts/user/${session!.user.id}`, bank),
                  () => setBank({ bankName: "", accountNumber: "", accountHolderName: "" }),
                )
              }
            />
          </>
        )}
      </Card>
      <Card>
        <H2>{t("Contacts")}</H2>
        {profile.contacts
          ?.filter((contact) => contact.active !== false)
          .map((contact) => (
            <View key={contact.id} style={{ gap: 8 }}>
              <Detail label={contact.contactType} value={contact.contactValue} />
              {canEdit && (
                <Button
                  title={t("Delete")}
                  variant="secondary"
                  disabled={action.busy}
                  onPress={() => remove(`/contacts/${contact.id}`)}
                />
              )}
            </View>
          ))}
        {canEdit && (
          <>
            <Select
              label={t("Contact type")}
              value={contactType}
              onChange={setContactType}
              options={["WhatsApp", "Instagram", "TikTok", "Website"].map((value) => ({
                value,
                label: value,
              }))}
            />
            <Field
              guide={
                contactType === "WhatsApp"
                  ? "Phone number"
                  : contactType === "Website"
                    ? "Website"
                    : "Social media handle"
              }
              label={t("Contact value")}
              value={contactValue}
              onChangeText={setContactValue}
              autoCapitalize="none"
            />
            <Button
              title={t("Add contact")}
              busy={action.busy}
              disabled={!contactValue.trim()}
              onPress={() =>
                void action.run(
                  () =>
                    mutate(`/contacts/user/${session!.user.id}`, {
                      contactType,
                      contactValue: contactValue.trim(),
                    }),
                  () => setContactValue(""),
                )
              }
            />
          </>
        )}
      </Card>
      <Card>
        <H2>{t("Verification documents")}</H2>
        {profile.verificationDocuments
          ?.filter((document) => document.active !== false)
          .map((document) => (
            <View key={document.id} style={{ gap: 8 }}>
              <P>
                {document.documentType} · {document.documentNumber}
              </P>
              {document.attachmentId && <AttachmentButton id={document.attachmentId} />}
              {canEdit && (
                <Button
                  title={t("Delete")}
                  variant="secondary"
                  disabled={action.busy}
                  onPress={() => remove(`/verification-documents/${document.id}`)}
                />
              )}
            </View>
          ))}
        {canEdit && (
          <>
            <Field
              guide="Document type"
              label={t("Document type")}
              required
              value={documentType}
              onChangeText={setDocumentType}
            />
            <Field
              guide="Document number"
              label={t("Document number")}
              value={documentNumber}
              onChangeText={setDocumentNumber}
            />
            <Button
              title={t("Upload document")}
              busy={action.busy}
              disabled={!documentType.trim()}
              onPress={() =>
                void action.run(async () => {
                  const file = await chooseFile();
                  if (!file) return;
                  const body = new FormData();
                  body.append("documentType", documentType.trim());
                  if (documentNumber.trim()) body.append("documentNumber", documentNumber.trim());
                  appendFile(body, "file", file);
                  await mutate(`/verification-documents/user/${session!.user.id}`, body);
                })
              }
            />
          </>
        )}
      </Card>
      <Card>
        <H2>{t("Portfolio")}</H2>
        {profile.portfolioAttachmentIds?.map((id) => (
          <AttachmentImage key={id} id={id} />
        ))}
        {canEdit && (
          <Button
            title={t("Add photo")}
            busy={action.busy}
            onPress={() =>
              void action.run(async () => {
                const file = await chooseFile(true);
                if (!file) return;
                const body = new FormData();
                body.append(
                  "keepPortfolioAttachmentIds",
                  JSON.stringify(profile.portfolioAttachmentIds ?? []),
                );
                appendFile(body, "portfolioImages", file);
                await api(`/vendor-profile/${profile.id}`, { method: "PUT", body });
                await reload();
              })
            }
          />
        )}
      </Card>
    </>
  );
}

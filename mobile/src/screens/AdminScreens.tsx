import React, { useState } from "react";
import { View } from "react-native";
import { useAuth } from "../auth/Provider";
import { useI18n } from "../i18n";
import type { Account, Page, SystemParameter, TermsDocument } from "../domain/contracts";
import type { VendorAdminProfile } from "../../../src/features/admin/types";
import { readAllPages } from "../../../src/shared/api/readAllPages";
import { jsonBody, query } from "../api/client";
import { positiveId } from "../domain/rules";
import { useGo } from "../navigation";
import { useAction, useResource } from "../components/hooks";
import { Terms } from "../components/Terms";
import { AttachmentButton } from "../components/Attachment";
import {
  Screen,
  Card,
  H1,
  H2,
  P,
  Field,
  Select,
  Toggle,
  Button,
  Badge,
  Detail,
  Empty,
  Loading,
  Feedback,
  RowLink,
  Pagination,
  useConfirm,
} from "../components/ui";

export function UsersScreen() {
  const { api, session } = useAuth();
  const { t } = useI18n();
  const action = useAction();
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const resource = useResource(
    () => api<Page<Account>>(`/users${query({ filter, pageNumber: page, pageSize: 10 })}`),
    [api, page, filter],
  );
  return (
    <Screen
      onRefresh={() => void resource.reload()}
      refreshing={resource.loading && Boolean(resource.data)}
    >
      <H1>{t("Users")}</H1>
      <Field label={t("Search")} value={search} onChangeText={setSearch} />
      <Button
        title={t("Search")}
        variant="secondary"
        onPress={() => {
          setFilter(search);
          setPage(1);
        }}
      />
      <Feedback error={action.error} />
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        <>
          {resource.data?.data.map((user) => (
            <Card key={user.id}>
              <H2>{user.fullname}</H2>
              <P>{user.email}</P>
              <Badge value={user.active ? "ACTIVE" : "INACTIVE"} />
              <Button
                title={t(user.active ? "Deactivate user" : "Activate user")}
                variant="secondary"
                disabled={action.busy || user.id === session!.user.id}
                onPress={() =>
                  confirm(
                    t(user.active ? "Deactivate user" : "Activate user"),
                    () =>
                      void action.run(
                        () => api(`/users/${user.id}`, jsonBody({ active: !user.active }, "PUT")),
                        resource.reload,
                      ),
                  )
                }
              />
            </Card>
          ))}
          {!resource.data?.data.length && <Empty />}
          <Pagination page={page} total={resource.data?.total ?? 0} onChange={setPage} />
        </>
      )}
    </Screen>
  );
}
export function VendorsScreen({ pendingOnly = false }: { pendingOnly?: boolean }) {
  const { api } = useAuth();
  const { t } = useI18n();
  const go = useGo();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const resource = useResource(async () => {
    if (!pendingOnly)
      return api<Page<VendorAdminProfile>>(
        `/vendor-profile${query({ pageNumber: page, pageSize: 10, filter })}`,
      );
    const all = await readAllPages((pageNumber) =>
      api<Page<VendorAdminProfile>>(
        `/vendor-profile${query({ pageNumber, pageSize: 100, filter })}`,
      ),
    );
    const pending = all.filter((vendor) => vendor.status === 2);
    return {
      data: pending.slice((page - 1) * 10, page * 10),
      total: pending.length,
      pageNumber: page,
      pageSize: 10,
    };
  }, [api, page, filter, pendingOnly]);
  return (
    <Screen
      onRefresh={() => void resource.reload()}
      refreshing={resource.loading && Boolean(resource.data)}
    >
      <H1>{t(pendingOnly ? "Vendor verification" : "Vendors")}</H1>
      <Field label={t("Search")} value={search} onChangeText={setSearch} />
      <Button
        title={t("Search")}
        variant="secondary"
        onPress={() => {
          setFilter(search);
          setPage(1);
        }}
      />
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        <>
          {resource.data?.data.map((vendor) => (
            <RowLink
              key={vendor.id}
              title={vendor.businessName || "—"}
              subtitle={vendor.ownerName || vendor.user?.fullname}
              trailing={
                <Badge
                  value={
                    vendor.isVerified
                      ? "VERIFIED"
                      : vendor.status === 2
                        ? "PENDING_VERIFICATION"
                        : "DRAFT"
                  }
                />
              }
              onPress={() => go("vendor-detail", String(vendor.id))}
            />
          ))}
          {!resource.data?.data.length && <Empty />}
          <Pagination page={page} total={resource.data?.total ?? 0} onChange={setPage} />
        </>
      )}
    </Screen>
  );
}
export function VendorDetailScreen({ id }: { id: string }) {
  const { api } = useAuth();
  const { t } = useI18n();
  const action = useAction();
  const confirm = useConfirm();
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const resource = useResource(
    () => api<VendorAdminProfile>(`/vendor-profile/${positiveId(id)}`),
    [api, id],
  );
  async function decide(approve: boolean) {
    if (resource.data?.status !== 2) throw new Error("CONFLICT");
    if (!approve && !reason.trim()) throw new Error("REQUIRED");
    try {
      await api(
        `/vendor-profile/${id}/${approve ? "verify" : "reject"}`,
        approve ? { method: "PUT" } : jsonBody({ rejectReason: reason.trim() }, "PUT"),
      );
      setRejecting(false);
    } finally {
      await resource.reload();
    }
  }
  const vendor = resource.data;
  return (
    <Screen
      onRefresh={() => void resource.reload()}
      refreshing={resource.loading && Boolean(vendor)}
    >
      <H1>{vendor?.businessName || t("Vendor verification")}</H1>
      {resource.loading && !vendor ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        vendor && (
          <>
            <Card>
              <Detail
                label={t("Owner name")}
                value={vendor.ownerName || vendor.user?.fullname || "—"}
              />
              <Detail
                label={t("Business email")}
                value={vendor.businessEmail || vendor.user?.email || "—"}
              />
              <Detail label={t("Business phone")} value={vendor.businessPhone || "—"} />
              <Detail label={t("Business address")} value={vendor.businessAddress || "—"} />
              <Detail label={t("Description")} value={vendor.description || "—"} />
              <Detail
                label={t("Category")}
                value={
                  Array.isArray(vendor.categories)
                    ? vendor.categories.join(", ")
                    : vendor.categories || "—"
                }
              />
              <Detail label={t("Service area")} value={vendor.serviceArea || "—"} />
            </Card>
            <Card>
              <H2>{t("Verification documents")}</H2>
              {vendor.verificationDocuments?.map((document) => (
                <View key={document.id} style={{ gap: 8 }}>
                  <P>
                    {document.documentType} · {document.documentNumber}
                  </P>
                  {document.attachmentId && <AttachmentButton id={document.attachmentId} />}
                </View>
              ))}
              {!vendor.verificationDocuments?.length && <Empty />}
            </Card>
            <Feedback error={action.error} />
            {vendor.status === 2 && (
              <>
                <Button
                  title={t("Approve vendor")}
                  busy={action.busy}
                  onPress={() =>
                    confirm(t("Approve vendor"), () => void action.run(() => decide(true)))
                  }
                />
                <Button
                  title={t("Reject vendor")}
                  variant="danger"
                  disabled={action.busy}
                  onPress={() => setRejecting(true)}
                />
              </>
            )}
            {rejecting && (
              <Card>
                <Field
                  label={t("Reason")}
                  multiline
                  required
                  value={reason}
                  onChangeText={setReason}
                />
                <Button
                  title={t("Confirm")}
                  busy={action.busy}
                  disabled={!reason.trim()}
                  onPress={() =>
                    confirm(t("Reject vendor"), () => void action.run(() => decide(false)))
                  }
                />
                <Button
                  title={t("Cancel")}
                  variant="secondary"
                  onPress={() => setRejecting(false)}
                />
              </Card>
            )}
          </>
        )
      )}
    </Screen>
  );
}
export function ReviewsScreen() {
  const { api, session } = useAuth();
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const resource = useResource(async () => {
    const vendor =
      session!.user.role === "VENDOR"
        ? await api<{ id: number }>(`/vendor-profile/user/${session!.user.id}`)
        : null;
    return api<
      Page<{
        id: string;
        rating: number;
        comment?: string;
        customer?: { fullName: string };
        vendorProduct?: { name: string };
        vendor?: { id: number };
      }>
    >(`/vendor-product-reviews${query({ vendorId: vendor?.id, pageNumber: page, pageSize: 10 })}`);
  }, [api, page, session!.user.id, session!.user.role]);
  return (
    <Screen>
      <H1>{t("Reviews")}</H1>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        <>
          {resource.data?.data.map((review) => (
            <Card key={review.id}>
              <H2>{review.vendorProduct?.name || "—"}</H2>
              <P>
                {review.customer?.fullName} · {review.rating} / 5
              </P>
              <P>{review.comment || "—"}</P>
            </Card>
          ))}
          {!resource.data?.data.length && <Empty />}
          <Pagination page={page} total={resource.data?.total ?? 0} onChange={setPage} />
        </>
      )}
    </Screen>
  );
}
export function ParametersScreen({ id, edit = false }: { id?: string; edit?: boolean }) {
  const { api } = useAuth();
  const { t } = useI18n();
  const go = useGo();
  const [page, setPage] = useState(1);
  const resource = useResource(
    async () =>
      edit
        ? {
            item: id ? await api<SystemParameter>(`/parameter/${positiveId(id)}`) : null,
            list: null,
          }
        : {
            item: null,
            list: await api<Page<SystemParameter>>("/parameter?pageNumber=1&pageSize=1000"),
          },
    [api, id, edit],
  );
  return (
    <Screen>
      <H1>{t("Parameters")}</H1>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : edit ? (
        <ParameterForm key={id || "new"} parameter={resource.data?.item || null} />
      ) : (
        <>
          <Button title={t("Add parameter")} onPress={() => go("parameter")} />
          {resource.data?.list?.data.slice((page - 1) * 10, page * 10).map((parameter) => (
            <RowLink
              key={parameter.id}
              title={parameter.code}
              subtitle={parameter.description || ""}
              onPress={() => go("parameter", parameter.id)}
            />
          ))}
          {!resource.data?.list?.data.length && <Empty />}
          <Pagination
            page={page}
            total={resource.data?.list?.data.length ?? 0}
            onChange={setPage}
          />
        </>
      )}
    </Screen>
  );
}
function ParameterForm({ parameter }: { parameter: SystemParameter | null }) {
  const { api } = useAuth();
  const { t } = useI18n();
  const go = useGo();
  const action = useAction();
  const confirm = useConfirm();
  const [code, setCode] = useState(parameter?.code || "");
  const [description, setDescription] = useState(parameter?.description || "");
  const [active, setActive] = useState(parameter?.active ?? true);
  const [details, setDetails] = useState(parameter?.details || []);
  return (
    <Card>
      <Field
        label={t("Code")}
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        required
      />
      <Field label={t("Description")} value={description} onChangeText={setDescription} />
      <Toggle label={t("Active")} value={active} onChange={setActive} />
      {details.map((detail, index) => (
        <Card key={detail.id || `new-${index}`}>
          <Field
            label={t("Code")}
            value={detail.code}
            onChangeText={(value) =>
              setDetails((previous) =>
                previous.map((entry, i) => (i === index ? { ...entry, code: value } : entry)),
              )
            }
          />
          <Field
            label={t("Description")}
            value={detail.description || ""}
            onChangeText={(value) =>
              setDetails((previous) =>
                previous.map((entry, i) =>
                  i === index ? { ...entry, description: value } : entry,
                ),
              )
            }
          />
          <Toggle
            label={t("Active")}
            value={detail.active}
            onChange={(value) =>
              setDetails((previous) =>
                previous.map((entry, i) => (i === index ? { ...entry, active: value } : entry)),
              )
            }
          />
          <Button
            title={t("Remove detail")}
            variant="secondary"
            onPress={() => setDetails((previous) => previous.filter((_, i) => i !== index))}
          />
        </Card>
      ))}
      <Button
        title={t("Add detail")}
        variant="secondary"
        onPress={() =>
          setDetails((previous) => [
            ...previous,
            { code: "", description: "", active: true, ordering: previous.length + 1 },
          ])
        }
      />
      <Feedback error={action.error} />
      <Button
        title={t("Save")}
        busy={action.busy}
        onPress={() =>
          void action.run(async () => {
            if (!code.trim() || details.some((detail) => !detail.code.trim()))
              throw new Error("REQUIRED");
            await api(
              parameter ? `/parameter/${parameter.id}` : "/parameter",
              jsonBody(
                {
                  code: code.trim(),
                  description: description.trim(),
                  active,
                  details: details.map((detail, index) => ({
                    id: detail.id,
                    code: detail.code.trim(),
                    description: detail.description,
                    active: detail.active,
                    ordering: index + 1,
                  })),
                },
                parameter ? "PUT" : "POST",
              ),
            );
            go("parameters");
          })
        }
      />
      {parameter && (
        <Button
          title={t("Delete")}
          variant="danger"
          disabled={action.busy}
          onPress={() =>
            confirm(
              t("Delete"),
              () =>
                void action.run(
                  () => api(`/parameter/${parameter.id}`, { method: "DELETE" }),
                  () => go("parameters"),
                ),
            )
          }
        />
      )}
    </Card>
  );
}
export function TermsScreen({ edit = false }: { edit?: boolean }) {
  const { api } = useAuth();
  const { t } = useI18n();
  const go = useGo();
  const action = useAction();
  const confirm = useConfirm();
  const resource = useResource(
    () => (edit ? Promise.resolve([]) : api<TermsDocument[]>("/terms")),
    [api, edit],
  );
  const [type, setType] = useState("CUSTOMER");
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<TermsDocument | null>(null);
  return (
    <Screen>
      <H1>{t("Terms and conditions")}</H1>
      <Feedback error={action.error} />
      {edit ? (
        <Card>
          <Select
            label={t("Customer")}
            value={type}
            onChange={setType}
            options={[
              { value: "CUSTOMER", label: t("Customer") },
              { value: "VENDOR", label: t("Vendor") },
            ]}
          />
          <Field label={t("Version")} required value={version} onChangeText={setVersion} />
          <Field label={t("Title")} required value={title} onChangeText={setTitle} />
          <Field
            label={t("Content")}
            required
            value={content}
            onChangeText={setContent}
            multiline
          />
          <Button
            title={t("Save")}
            busy={action.busy}
            onPress={() =>
              void action.run(async () => {
                if (![version, title, content].every((value) => value.trim()))
                  throw new Error("REQUIRED");
                await api(
                  "/terms",
                  jsonBody({
                    termsType: type,
                    version: version.trim(),
                    title: title.trim(),
                    content: content
                      .split(/\n\s*\n/)
                      .filter((paragraph) => paragraph.trim())
                      .map((paragraph) => ({ kind: "paragraph", text: paragraph.trim() })),
                    activate: false,
                  }),
                );
                go("terms");
              })
            }
          />
        </Card>
      ) : (
        <>
          <Button title={t("Create terms version")} onPress={() => go("terms-edit")} />
          {resource.loading ? (
            <Loading />
          ) : resource.error ? (
            <Feedback error={resource.error} retry={() => void resource.reload()} />
          ) : (
            resource.data?.map((document) => (
              <Card key={document.id}>
                <H2>{document.title}</H2>
                <P>
                  {document.termsType} · {document.version}
                </P>
                <Badge value={document.isActive ? "ACTIVE" : "INACTIVE"} />
                <Button
                  title={t("Details")}
                  variant="secondary"
                  busy={action.busy}
                  onPress={() =>
                    void action.run(() => api<TermsDocument>(`/terms/${document.id}`), setSelected)
                  }
                />
                {!document.isActive && (
                  <Button
                    title={t("Activate version")}
                    variant="secondary"
                    disabled={action.busy}
                    onPress={() =>
                      confirm(
                        t("Activate version"),
                        () =>
                          void action.run(
                            () => api(`/terms/${document.id}/activate`, { method: "PUT" }),
                            resource.reload,
                          ),
                      )
                    }
                  />
                )}
              </Card>
            ))
          )}
        </>
      )}
      {selected && (
        <>
          <Terms document={selected} />
          <Button title={t("Close")} variant="secondary" onPress={() => setSelected(null)} />
        </>
      )}
    </Screen>
  );
}
export function UnavailableScreen({ title }: { title: string }) {
  const { t } = useI18n();
  return (
    <Screen>
      <H1>{t(title)}</H1>
      <Card>
        <P>{t("Not available yet")}</P>
        <P muted>{t("This feature is not available in the backend yet.")}</P>
      </Card>
    </Screen>
  );
}

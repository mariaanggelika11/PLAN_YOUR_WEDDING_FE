import React, { useState } from "react";
import { View } from "react-native";
import { useAuth } from "../auth/Provider";
import { useI18n, money, dateLabel } from "../i18n";
import type { Order, OrderPayment, Page, Message } from "../domain/contracts";
import { canUpload, orderActions } from "../domain/rules";
import { jsonBody, query } from "../api/client";
import { useGo } from "../navigation";
import { useAction, useResource } from "../components/hooks";
import {
  AttachmentButton,
  AttachmentImage,
  appendFile,
  chooseFile,
  type NativeFile,
} from "../components/Attachment";
import {
  Screen,
  Card,
  H1,
  H2,
  P,
  Field,
  Select,
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

const actionTitles: Record<string, string> = {
  confirm: "Confirm order",
  reject: "Reject order",
  start: "Start work",
  deliver: "Deliver work",
  complete: "Complete order",
  cancel: "Cancel order",
  dispute: "Open dispute",
  "resolve-completed": "Resolve as completed",
  "resolve-cancelled": "Resolve as cancelled",
};
export function OrdersScreen({ disputes = false }: { disputes?: boolean }) {
  const { api } = useAuth();
  const { t, locale } = useI18n();
  const go = useGo();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const resource = useResource(
    () =>
      api<Page<Order>>(
        `/orders${query({ pageNumber: page, pageSize: 10, filter, status: disputes ? "DISPUTED" : status })}`,
      ),
    [api, page, filter, status, disputes],
  );
  return (
    <Screen
      onRefresh={() => void resource.reload()}
      refreshing={resource.loading && Boolean(resource.data)}
    >
      <H1>{t(disputes ? "Disputes" : "Orders")}</H1>
      <Field
        guide="Search"
        label={t("Search")}
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={() => {
          setFilter(search.trim());
          setPage(1);
        }}
        returnKeyType="search"
      />
      <Button
        title={t("Search")}
        variant="secondary"
        onPress={() => {
          setFilter(search.trim());
          setPage(1);
        }}
      />
      {!disputes && (
        <Select
          label={t("Status")}
          value={status}
          onChange={(next) => {
            setStatus(next);
            setPage(1);
          }}
          options={[
            { label: t("All"), value: "" },
            ...[
              "PENDING_PAYMENT",
              "WAITING_VENDOR_CONFIRMATION",
              "CONFIRMED",
              "IN_PROGRESS",
              "WAITING_CUSTOMER_CONFIRMATION",
              "COMPLETED",
              "CANCELLED",
              "REJECTED_BY_VENDOR",
              "DISPUTED",
            ].map((value) => ({ value, label: t(value) })),
          ]}
        />
      )}
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        <>
          {resource.data?.data.length ? (
            resource.data.data.map((order) => (
              <RowLink
                key={order.id}
                title={order.orderNumber}
                subtitle={`${order.vendor?.businessName ?? ""} · ${money(order.totalAmount, locale)}`}
                trailing={<Badge value={order.status} />}
                onPress={() => go("order", order.id)}
              />
            ))
          ) : (
            <Empty />
          )}
          <Pagination page={page} total={resource.data?.total ?? 0} onChange={setPage} />
        </>
      )}
    </Screen>
  );
}
export function OrderScreen({ id }: { id: string }) {
  const { api, session } = useAuth();
  const { t, locale } = useI18n();
  const go = useGo();
  const confirm = useConfirm();
  const action = useAction();
  const resource = useResource(() => api<Order>(`/orders/${encodeURIComponent(id)}`), [api, id]);
  const [reasonFor, setReasonFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const order = resource.data;
  if (resource.loading && !order)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (resource.error || !order)
    return (
      <Screen>
        <Feedback
          error={resource.error ?? new Error("REQUEST_FAILED")}
          retry={() => void resource.reload()}
        />
      </Screen>
    );
  const paid =
    order.paidAmount ??
    (order.payments ?? [])
      .filter((payment) => payment.active !== false && payment.status === "PAID")
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
  async function mutate(endpoint: string, init: RequestInit) {
    try {
      await api(endpoint, init);
    } finally {
      await resource.reload();
    }
  }
  function act(kind: string) {
    if (["reject", "cancel", "dispute", "resolve-completed", "resolve-cancelled"].includes(kind)) {
      setReasonFor(kind);
      setReason("");
      return;
    }
    confirm(
      t(actionTitles[kind]),
      () => void action.run(() => mutate(`/orders/${order!.id}/${kind}`, { method: "PUT" })),
      t("This action changes the order status."),
    );
  }
  async function submitReason() {
    if (!reasonFor || !reason.trim()) return;
    const resolved = reasonFor.startsWith("resolve-");
    const body = resolved
      ? {
          status: reasonFor === "resolve-completed" ? "COMPLETED" : "CANCELLED",
          note: reason.trim(),
        }
      : reasonFor === "reject"
        ? { rejectReason: reason.trim() }
        : { reason: reason.trim() };
    await action.run(
      () =>
        mutate(
          `/orders/${order!.id}/${resolved ? "resolve-dispute" : reasonFor}`,
          jsonBody(body, "PUT"),
        ),
      () => {
        setReasonFor(null);
        setReason("");
      },
    );
  }
  return (
    <Screen refreshing={resource.loading} onRefresh={() => void resource.reload()}>
      <H1>{order.orderNumber}</H1>
      <Badge value={order.status} />
      <Feedback error={action.error} />
      <Card>
        <H2>{t("Order summary")}</H2>
        <Detail label={t("Vendor")} value={order.vendor.businessName} />
        <Detail label={t("Customer")} value={order.customer.fullName} />
        <Detail label={t("Package")} value={order.productName || order.vendorProduct?.name} />
        <Detail label={t("Event date")} value={dateLabel(order.eventDate, locale)} />
        <Detail label={t("Event location")} value={order.eventLocation} />
        <Detail label={t("Guest count")} value={order.guestCount ?? "—"} />
        <Detail label={t("Total")} value={money(order.totalAmount, locale)} />
        <Detail label={t("Paid amount")} value={money(paid, locale)} />
        <Detail
          label={t("Outstanding amount")}
          value={money(order.outstandingAmount ?? Math.max(0, order.totalAmount - paid), locale)}
        />
        {order.notes && <Detail label={t("Notes")} value={order.notes} />}
        {order.rejectReason && <Detail label={t("Reject reason")} value={order.rejectReason} />}
      </Card>
      {(order.payments ?? []).map((payment) => (
        <PaymentCard key={payment.id} payment={payment} order={order} reload={resource.reload} />
      ))}
      {session!.user.role === "CUSTOMER" &&
        order.status === "WAITING_CUSTOMER_CONFIRMATION" &&
        paid < order.totalAmount &&
        !order.payments?.some((payment) => payment.installment === "REMAINING") && (
          <Button
            title={t("Create balance payment")}
            busy={action.busy}
            onPress={() =>
              confirm(
                t("Create balance payment"),
                () =>
                  void action.run(() => mutate(`/orders/${order.id}/payments`, { method: "POST" })),
              )
            }
          />
        )}
      {orderActions(order, session!.user.role).map((kind) => (
        <Button
          key={kind}
          title={t(actionTitles[kind])}
          variant={["cancel", "reject"].includes(kind) ? "danger" : "secondary"}
          disabled={action.busy || (kind === "complete" && paid < order.totalAmount)}
          onPress={() => act(kind)}
        />
      ))}
      {reasonFor && (
        <Card>
          <H2>{t(actionTitles[reasonFor])}</H2>
          {reasonFor === "cancel" && (
            <P muted>{t("A cancellation does not automatically refund payments.")}</P>
          )}
          <Field
            guide="Reason"
            label={t("Reason")}
            required
            multiline
            value={reason}
            onChangeText={setReason}
          />
          <Button
            title={t("Confirm")}
            disabled={!reason.trim()}
            busy={action.busy}
            onPress={() => confirm(t(actionTitles[reasonFor]), () => void submitReason())}
          />
          <Button title={t("Cancel")} variant="secondary" onPress={() => setReasonFor(null)} />
        </Card>
      )}
      <Button
        title={t("Conversation")}
        variant="secondary"
        onPress={() => go("messages", order.id)}
      />
      {session!.user.role === "CUSTOMER" && order.status === "COMPLETED" && (
        <Button
          title={t("Write a review")}
          variant="secondary"
          onPress={() => go("review", order.id)}
        />
      )}
    </Screen>
  );
}
function PaymentCard({
  payment,
  order,
  reload,
}: {
  payment: OrderPayment;
  order: Order;
  reload: () => Promise<void>;
}) {
  const { api, session } = useAuth();
  const { t, locale } = useI18n();
  const confirm = useConfirm();
  const action = useAction();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  async function upload() {
    const file = await chooseFile();
    if (!file) return;
    const body = new FormData();
    appendFile(body, "proof", file);
    try {
      await api(`/order-payments/${payment.id}/proof`, { method: "PUT", body });
    } finally {
      await reload();
    }
  }
  async function decide(approve: boolean) {
    try {
      await api(
        `/order-payments/${payment.id}/${approve ? "verify" : "reject"}`,
        approve ? { method: "PUT" } : jsonBody({ rejectReason: reason.trim() }, "PUT"),
      );
      setRejecting(false);
    } finally {
      await reload();
    }
  }
  return (
    <Card>
      <H2>
        {t(
          payment.installment === "DP"
            ? "Deposit"
            : payment.installment === "FULL"
              ? "Full payment"
              : "Balance payment",
        )}
      </H2>
      <Badge value={payment.status} />
      <Detail label={t("Total")} value={money(payment.amount, locale)} />
      <Detail label={t("Bank name")} value={payment.bankName || "—"} />
      <Detail label={t("Account number")} value={payment.accountNumber || "—"} />
      <Detail label={t("Account holder")} value={payment.accountHolderName || "—"} />
      {payment.rejectReason && <Detail label={t("Reject reason")} value={payment.rejectReason} />}
      {payment.proofAttachmentId && <AttachmentButton id={payment.proofAttachmentId} />}
      {payment.proofs?.map((proof) => (
        <View key={proof.id} style={{ gap: 8 }}>
          <Badge value={proof.status} />
          <P muted>{dateLabel(proof.submittedAt, locale)}</P>
          {proof.rejectReason && <P>{proof.rejectReason}</P>}
          <AttachmentButton id={proof.attachmentId} />
        </View>
      ))}
      <Feedback error={action.error} />
      {session!.user.role === "CUSTOMER" && canUpload(order, payment) && (
        <>
          <P muted>{t("JPG, PNG or PDF, maximum 5 MB")}</P>
          <Button
            title={t("Upload payment proof")}
            busy={action.busy}
            onPress={() => void action.run(upload)}
          />
        </>
      )}
      {["VENDOR", "ADMIN"].includes(session!.user.role) &&
        payment.status === "WAITING_VERIFICATION" && (
          <>
            <Button
              title={t("Approve payment")}
              busy={action.busy}
              onPress={() =>
                confirm(t("Approve payment"), () => void action.run(() => decide(true)))
              }
            />
            <Button
              title={t("Reject payment")}
              variant="danger"
              disabled={action.busy}
              onPress={() => setRejecting(true)}
            />
          </>
        )}
      {rejecting && (
        <>
          <Field
            guide="Reason"
            required
            label={t("Reason")}
            value={reason}
            onChangeText={setReason}
            multiline
          />
          <Button
            title={t("Confirm")}
            disabled={!reason.trim()}
            busy={action.busy}
            onPress={() => confirm(t("Reject payment"), () => void action.run(() => decide(false)))}
          />
          <Button title={t("Cancel")} variant="secondary" onPress={() => setRejecting(false)} />
        </>
      )}
    </Card>
  );
}
export function PaymentsScreen({ id }: { id?: string }) {
  const { api } = useAuth();
  const { t, locale } = useI18n();
  const go = useGo();
  const [page, setPage] = useState(1);
  const action = useAction();
  const confirm = useConfirm();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const resource = useResource(
    async () =>
      id
        ? {
            payment: await api<OrderPayment>(`/order-payments/${encodeURIComponent(id)}`),
            page: null,
          }
        : {
            payment: null,
            page: await api<Page<OrderPayment>>(
              `/order-payments${query({ status: "WAITING_VERIFICATION", pageNumber: page, pageSize: 10 })}`,
            ),
          },
    [api, id, page],
  );
  const selected = resource.data?.payment;
  async function decide(approve: boolean) {
    if (!selected || selected.status !== "WAITING_VERIFICATION") throw new Error("CONFLICT");
    if (!approve && !reason.trim()) throw new Error("REQUIRED");
    try {
      await api(
        `/order-payments/${selected.id}/${approve ? "verify" : "reject"}`,
        approve ? { method: "PUT" } : jsonBody({ rejectReason: reason.trim() }, "PUT"),
      );
      setRejecting(false);
    } finally {
      await resource.reload();
    }
  }
  return (
    <Screen
      onRefresh={() => void resource.reload()}
      refreshing={resource.loading && Boolean(resource.data)}
    >
      <H1>{t("Payment verification")}</H1>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : selected ? (
        <>
          <Card>
            <Detail label={t("Orders")} value={selected.order?.orderNumber || "—"} />
            <Detail label={t("Total")} value={money(selected.amount, locale)} />
            <Badge value={selected.status} />
            {selected.proofAttachmentId && <AttachmentButton id={selected.proofAttachmentId} />}
            {selected.proofs?.map((proof) => (
              <View key={proof.id} style={{ gap: 8 }}>
                <Badge value={proof.status} />
                {proof.rejectReason && <P>{proof.rejectReason}</P>}
                <AttachmentButton id={proof.attachmentId} />
              </View>
            ))}
          </Card>
          <Feedback error={action.error} />
          {selected.status === "WAITING_VERIFICATION" && (
            <>
              <Button
                title={t("Approve payment")}
                busy={action.busy}
                onPress={() =>
                  confirm(t("Approve payment"), () => void action.run(() => decide(true)))
                }
              />
              <Button
                title={t("Reject payment")}
                variant="danger"
                disabled={action.busy}
                onPress={() => setRejecting(true)}
              />
            </>
          )}
          {rejecting && (
            <Card>
              <Field
                guide="Reason"
                label={t("Reason")}
                value={reason}
                onChangeText={setReason}
                multiline
                required
              />
              <Button
                title={t("Confirm")}
                disabled={!reason.trim()}
                busy={action.busy}
                onPress={() =>
                  confirm(t("Reject payment"), () => void action.run(() => decide(false)))
                }
              />
              <Button title={t("Cancel")} variant="secondary" onPress={() => setRejecting(false)} />
            </Card>
          )}
          {selected.order?.id && (
            <Button title={t("Order summary")} onPress={() => go("order", selected.order!.id)} />
          )}
        </>
      ) : (
        <>
          {resource.data?.page?.data.length ? (
            resource.data.page.data.map((payment) => (
              <RowLink
                key={payment.id}
                title={payment.order?.orderNumber || payment.id}
                subtitle={money(payment.amount, locale)}
                trailing={<Badge value={payment.status} />}
                onPress={() => go("payment", payment.id)}
              />
            ))
          ) : (
            <Empty />
          )}
          <Pagination page={page} total={resource.data?.page?.total ?? 0} onChange={setPage} />
        </>
      )}
    </Screen>
  );
}
export function MessagesScreen({ id }: { id: string }) {
  const { api } = useAuth();
  const { t, locale } = useI18n();
  const action = useAction();
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<NativeFile | null>(null);
  const [page, setPage] = useState(1);
  const resource = useResource(
    () =>
      api<Page<Message> & { canSend: boolean }>(
        `/orders/${encodeURIComponent(id)}/messages?pageNumber=${page}&pageSize=30`,
      ),
    [api, id, page],
  );
  async function send() {
    if (!message.trim() && !image) throw new Error("REQUIRED");
    const body = new FormData();
    if (message.trim()) body.append("message", message.trim());
    if (image) appendFile(body, "images", image);
    await api(`/orders/${id}/messages`, { method: "POST", body });
    setMessage("");
    setImage(null);
    await resource.reload();
  }
  return (
    <Screen
      onRefresh={() => void resource.reload()}
      refreshing={resource.loading && Boolean(resource.data)}
    >
      <H1>{t("Conversation")}</H1>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        <>
          {resource.data?.data.length ? (
            resource.data.data.map((item) => (
              <Card key={item.id} style={{ backgroundColor: item.isMine ? "#F8EDF0" : "#FFFFFF" }}>
                <P muted>
                  {item.sender.fullname} · {dateLabel(item.createdAt, locale)}
                </P>
                <P>{item.message}</P>
                {item.imageAttachmentIds?.map((attachment) => (
                  <AttachmentImage key={attachment} id={attachment} />
                ))}
              </Card>
            ))
          ) : (
            <Empty />
          )}
          <Pagination
            page={page}
            pageSize={30}
            total={resource.data?.total ?? 0}
            onChange={setPage}
          />
          {resource.data?.canSend && (
            <Card>
              <Field
                guide="Message"
                label={t("Message")}
                multiline
                value={message}
                onChangeText={setMessage}
              />
              <Button
                title={image?.name || t("Add photo")}
                variant="secondary"
                disabled={action.busy}
                onPress={() => void action.run(async () => setImage(await chooseFile(true)))}
              />
              <Feedback error={action.error} />
              <Button
                title={t("Send")}
                disabled={!message.trim() && !image}
                busy={action.busy}
                onPress={() => void action.run(send)}
              />
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
export function ReviewScreen({ id }: { id: string }) {
  const { api } = useAuth();
  const { t } = useI18n();
  const action = useAction();
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);
  const resource = useResource(async () => {
    const order = await api<Order>(`/orders/${encodeURIComponent(id)}`);
    const reviews = await api<Page<{ id: string; order?: { id: string } }>>(
      `/vendor-product-reviews${query({ orderId: id, customerId: order.customer.id, vendorProductId: order.vendorProduct.id, pageNumber: 1, pageSize: 10 })}`,
    );
    return { order, existing: reviews.data.some((review) => String(review.order?.id) === id) };
  }, [api, id]);
  return (
    <Screen>
      <H1>{t("Write a review")}</H1>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : saved || resource.data?.existing ? (
        <Card>
          <P>{t("Review submitted")}</P>
        </Card>
      ) : resource.data?.order.status !== "COMPLETED" ? (
        <Feedback error={new Error("FORBIDDEN")} />
      ) : (
        <Card>
          <Select
            label={t("Rating")}
            value={rating}
            onChange={setRating}
            options={[5, 4, 3, 2, 1].map((value) => ({
              value: String(value),
              label: `${value} / 5`,
            }))}
          />
          <Field
            guide="Comment"
            label={t("Comment")}
            multiline
            value={comment}
            onChangeText={setComment}
          />
          <Feedback error={action.error} />
          <Button
            title={t("Submit review")}
            busy={action.busy}
            onPress={() =>
              void action.run(async () => {
                const body = new FormData();
                body.append("orderId", id);
                body.append("rating", rating);
                if (comment.trim()) body.append("comment", comment.trim());
                await api("/vendor-product-reviews", { method: "POST", body });
                setSaved(true);
              })
            }
          />
        </Card>
      )}
    </Screen>
  );
}

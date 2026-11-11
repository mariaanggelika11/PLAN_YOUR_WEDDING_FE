import React, { useState } from "react";
import { View } from "react-native";
import { useAuth } from "../auth/Provider";
import { useI18n, money, dateLabel } from "../i18n";
import { planningText } from "../i18n/planning";
import { fromApiTask } from "../../../src/features/planning/adapters";
import {
  setTaskStatus,
  toggleSubtask,
  type WeddingTask,
} from "../../../src/features/planning/model";
import type { ApiWeddingTask, Budget, Page, AppNotification } from "../domain/contracts";
import { jsonBody } from "../api/client";
import { useGo } from "../navigation";
import { useAction, useResource } from "../components/hooks";
import {
  Screen,
  Card,
  H1,
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
  DateField,
  Toggle,
  useConfirm,
  styles,
} from "../components/ui";

export function BudgetScreen() {
  const { api } = useAuth();
  const { t, locale } = useI18n();
  const go = useGo();
  const resource = useResource(() => api<Budget>("/budget/summary"), [api]);
  const labels = {
    totalBudget: "Estimated budget",
    committedAmount: "Committed amount",
    verifiedPayments: "Verified payments",
    remainingBudget: "Remaining budget",
    outstandingBills: "Outstanding bills",
  } as const;
  return (
    <Screen
      onRefresh={() => void resource.reload()}
      refreshing={resource.loading && Boolean(resource.data)}
    >
      <H1>{t("Budget")}</H1>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        resource.data && (
          <>
            {resource.data.overBudget && <Badge value="Over budget" />}
            <View style={styles.grid}>
              {Object.entries(labels).map(([key, label]) => (
                <Card key={key} style={styles.stat}>
                  <Detail
                    label={t(label)}
                    value={money(resource.data![key as keyof typeof labels], locale)}
                  />
                </Card>
              ))}
            </View>
            <Button title={t("Profile")} variant="secondary" onPress={() => go("profile")} />
            {resource.data.items.map((item) => (
              <RowLink
                key={item.orderId}
                title={item.orderNumber}
                subtitle={`${item.vendorName} · ${money(item.totalAmount, locale)}`}
                onPress={() => go("order", item.orderId)}
              />
            ))}
          </>
        )
      )}
    </Screen>
  );
}
export function PlanningScreen() {
  const { api } = useAuth();
  const { t, locale } = useI18n();
  const go = useGo();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const resource = useResource(
    () =>
      api<Page<ApiWeddingTask>>(
        `/wedding-tasks?pageNumber=${page}&pageSize=10&sortBy=due_asc${status ? `&status=${status}` : ""}`,
      ),
    [api, page, status],
  );
  return (
    <Screen
      onRefresh={() => void resource.reload()}
      refreshing={resource.loading && Boolean(resource.data)}
    >
      <H1>{t("Wedding preparation")}</H1>
      <View style={styles.row}>
        <Button title={t("Add task")} onPress={() => go("task")} />
        <Button
          title={t("Planning settings")}
          variant="secondary"
          onPress={() => go("planning-settings")}
        />
      </View>
      <Select
        label={t("Status")}
        value={status}
        onChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        options={[
          { label: t("All"), value: "" },
          ...["TODO", "IN_PROGRESS", "COMPLETED", "SKIPPED"].map((value) => ({
            label: t(value),
            value,
          })),
        ]}
      />
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        <>
          {resource.data?.data.length ? (
            resource.data.data.map((task) => (
              <RowLink
                key={task.id}
                title={planningText(task, task.title, locale)}
                subtitle={`${task.category} · ${dateLabel(task.dueDate, locale)}`}
                trailing={<Badge value={task.status} />}
                onPress={() => go("task", String(task.id))}
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
export function TaskScreen({ id }: { id?: string }) {
  const { api } = useAuth();
  const resource = useResource(
    () =>
      id ? api<ApiWeddingTask>(`/wedding-tasks/${encodeURIComponent(id)}`) : Promise.resolve(null),
    [api, id],
  );
  return (
    <Screen>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        <TaskForm key={id || "new"} task={resource.data} />
      )}
    </Screen>
  );
}
function TaskForm({ task }: { task: ApiWeddingTask | null }) {
  const { api } = useAuth();
  const { t, locale } = useI18n();
  const go = useGo();
  const action = useAction();
  const confirm = useConfirm();
  const [title, setTitle] = useState(task?.title || "");
  const [category, setCategory] = useState(task?.category || "");
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) || "");
  const [important, setImportant] = useState(task?.important || false);
  const [progress, setProgress] = useState<WeddingTask>(() =>
    task
      ? fromApiTask(task)
      : {
          id: "",
          title: "",
          category: "",
          guide: "",
          daysBefore: null,
          due: "",
          customDue: false,
          important: false,
          status: "TODO",
          assignee: "",
          notes: "",
          vendor: "",
          orderId: "",
          subtasks: [],
        },
  );
  const [dateEdited, setDateEdited] = useState(false);
  const [assignee, setAssignee] = useState(task?.assignee || "");
  const [notes, setNotes] = useState(task?.notes || "");
  const [externalVendor, setExternalVendor] = useState(task?.externalVendor || "");
  return (
    <>
      <H1>{t(task ? "Edit task" : "Add task")}</H1>
      <Card>
        <Field
          guide="Task title"
          label={t("Task title")}
          required
          value={title}
          onChangeText={setTitle}
        />
        <Field
          guide="Task category"
          label={t("Category")}
          required
          value={category}
          onChangeText={setCategory}
        />
        <DateField
          label={t("Due date")}
          value={dueDate}
          onChange={(value) => {
            setDueDate(value);
            setDateEdited(true);
          }}
        />
        <Select
          label={t("Status")}
          value={progress.status}
          onChange={(value) =>
            setProgress((previous) => setTaskStatus(previous, value as WeddingTask["status"]))
          }
          options={["TODO", "IN_PROGRESS", "COMPLETED", "SKIPPED"].map((value) => ({
            value,
            label: t(value),
          }))}
        />
        <Field guide="Assignee" label={t("Assignee")} value={assignee} onChangeText={setAssignee} />
        <Field
          guide="External vendor"
          label={t("External vendor")}
          value={externalVendor}
          onChangeText={setExternalVendor}
        />
        <Field guide="Notes" label={t("Notes")} multiline value={notes} onChangeText={setNotes} />
        <Toggle label={t("Important")} value={important} onChange={setImportant} />
        {progress.subtasks.map((subtask, index) => (
          <Toggle
            key={index}
            label={task ? planningText(task, subtask.title, locale) : subtask.title}
            value={subtask.done}
            onChange={() => setProgress((previous) => toggleSubtask(previous, index))}
          />
        ))}
        <Feedback error={action.error} />
        <Button
          title={t("Save")}
          busy={action.busy}
          onPress={() =>
            void action.run(async () => {
              if (!title.trim() || !category.trim()) throw new Error("REQUIRED");
              await api(
                task ? `/wedding-tasks/${task.id}` : "/wedding-tasks",
                jsonBody(
                  {
                    title: title.trim(),
                    category: category.trim(),
                    dueDate: dueDate || null,
                    customDue: dateEdited
                      ? Boolean(dueDate)
                      : (task?.customDue ?? Boolean(dueDate)),
                    important,
                    status: progress.status,
                    subtasks: progress.subtasks,
                    assignee: assignee.trim(),
                    notes: notes.trim(),
                    externalVendor: externalVendor.trim(),
                    ...(task ? {} : { guide: "", daysBeforeEvent: null, orderId: null }),
                  },
                  task ? "PUT" : "POST",
                ),
              );
              go("planning");
            })
          }
        />
        {task && (
          <Button
            title={t("Delete")}
            variant="danger"
            disabled={action.busy}
            onPress={() =>
              confirm(
                t("Delete"),
                () =>
                  void action.run(
                    () => api(`/wedding-tasks/${task.id}`, { method: "DELETE" }),
                    () => go("planning"),
                  ),
              )
            }
          />
        )}
      </Card>
    </>
  );
}
interface Preferences {
  traditional: boolean;
  outdoor: boolean;
  useWo: boolean;
  autoReschedule: boolean;
}
export function PlanningSettingsScreen() {
  const { api } = useAuth();
  const resource = useResource(() => api<Preferences>("/wedding-plans"), [api]);
  return (
    <Screen>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        resource.data && <SettingsForm preferences={resource.data} />
      )}
    </Screen>
  );
}
function SettingsForm({ preferences }: { preferences: Preferences }) {
  const { api } = useAuth();
  const { t } = useI18n();
  const go = useGo();
  const action = useAction();
  const [values, setValues] = useState(preferences);
  return (
    <Card>
      {Object.entries({
        traditional: "Traditional ceremony",
        outdoor: "Outdoor event",
        useWo: "Use wedding organizer",
        autoReschedule: "Auto reschedule",
      }).map(([key, label]) => (
        <Toggle
          key={key}
          label={t(label)}
          value={values[key as keyof Preferences]}
          onChange={(value) => setValues((previous) => ({ ...previous, [key]: value }))}
        />
      ))}
      <Feedback error={action.error} />
      <Button
        title={t("Save")}
        busy={action.busy}
        onPress={() =>
          void action.run(
            () =>
              api(
                "/wedding-plans",
                jsonBody(
                  {
                    traditional: values.traditional,
                    outdoor: values.outdoor,
                    useWo: values.useWo,
                    autoReschedule: values.autoReschedule,
                  },
                  "PUT",
                ),
              ),
            () => go("planning"),
          )
        }
      />
    </Card>
  );
}
export function NotificationsScreen() {
  const { api } = useAuth();
  const { t, locale } = useI18n();
  const action = useAction();
  const [page, setPage] = useState(1);
  const resource = useResource(
    () => api<Page<AppNotification>>(`/notifications?pageNumber=${page}&pageSize=10`),
    [api, page],
  );
  return (
    <Screen
      onRefresh={() => void resource.reload()}
      refreshing={resource.loading && Boolean(resource.data)}
    >
      <H1>{t("Notifications")}</H1>
      <Feedback error={action.error} />
      <Button
        title={t("Mark all as read")}
        variant="secondary"
        busy={action.busy}
        onPress={() =>
          void action.run(() => api("/notifications/read-all", { method: "PUT" }), resource.reload)
        }
      />
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <Feedback error={resource.error} retry={() => void resource.reload()} />
      ) : (
        <>
          {resource.data?.data.length ? (
            resource.data.data.map((notification) => (
              <Card key={notification.id}>
                <P>{notification.title}</P>
                <P muted>{notification.message}</P>
                <P muted>{dateLabel(notification.createdAt, locale)}</P>
                {!notification.isRead && (
                  <Button
                    title={t("Mark as read")}
                    variant="secondary"
                    disabled={action.busy}
                    onPress={() =>
                      void action.run(
                        () =>
                          api(`/notifications/${encodeURIComponent(notification.id)}/read`, {
                            method: "PUT",
                          }),
                        resource.reload,
                      )
                    }
                  />
                )}
              </Card>
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

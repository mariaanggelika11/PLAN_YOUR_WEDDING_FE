import React from "react";
import { useAuth } from "../auth/Provider";
import { canVisit, type PageParams } from "../navigation";
import { Screen, Feedback } from "../components/ui";
import { DashboardScreen } from "./DashboardScreen";
import { MoreScreen } from "./MoreScreen";
import {
  ProductsScreen,
  ProductScreen,
  ProductEditScreen,
  StoreScreen,
  CheckoutScreen,
} from "./ProductScreens";
import {
  OrdersScreen,
  OrderScreen,
  PaymentsScreen,
  MessagesScreen,
  ReviewScreen,
} from "./OrderScreens";
import {
  PlanningScreen,
  PlanningSettingsScreen,
  TaskScreen,
  BudgetScreen,
  NotificationsScreen,
} from "./PlanningScreens";
import { ProfileScreen } from "./ProfileScreen";
import {
  UsersScreen,
  VendorsScreen,
  VendorDetailScreen,
  ReviewsScreen,
  ParametersScreen,
  TermsScreen,
  UnavailableScreen,
} from "./AdminScreens";

export function PageContent(params: PageParams) {
  const { session } = useAuth();
  const kind = params?.kind;
  const id = params?.id;
  if (!session || !kind || !canVisit(session.user.role, kind))
    return (
      <Screen>
        <Feedback error={new Error("FORBIDDEN")} />
      </Screen>
    );
  switch (kind) {
    case "dashboard":
      return <DashboardScreen />;
    case "more":
      return <MoreScreen />;
    case "marketplace":
      return <ProductsScreen marketplace />;
    case "products":
      return <ProductsScreen />;
    case "product":
      return id ? <ProductScreen id={id} /> : <Missing />;
    case "store":
      return id ? <StoreScreen id={id} /> : <Missing />;
    case "product-edit":
      return <ProductEditScreen id={id} />;
    case "checkout":
      return id ? <CheckoutScreen id={id} /> : <Missing />;
    case "orders":
      return <OrdersScreen />;
    case "disputes":
      return <OrdersScreen disputes />;
    case "order":
      return id ? <OrderScreen id={id} /> : <Missing />;
    case "payment":
      return id ? <PaymentsScreen id={id} /> : <Missing />;
    case "payments":
      return <PaymentsScreen />;
    case "messages":
      return id ? <MessagesScreen id={id} /> : <Missing />;
    case "review":
      return id ? <ReviewScreen id={id} /> : <Missing />;
    case "profile":
      return <ProfileScreen />;
    case "budget":
      return <BudgetScreen />;
    case "planning":
      return <PlanningScreen />;
    case "task":
      return <TaskScreen id={id} />;
    case "planning-settings":
      return <PlanningSettingsScreen />;
    case "notifications":
      return <NotificationsScreen />;
    case "users":
      return <UsersScreen />;
    case "vendors":
      return <VendorsScreen />;
    case "vendor-verification":
      return <VendorsScreen pendingOnly />;
    case "vendor-detail":
      return id ? <VendorDetailScreen id={id} /> : <Missing />;
    case "reviews":
      return <ReviewsScreen />;
    case "parameters":
      return <ParametersScreen />;
    case "parameter":
      return <ParametersScreen id={id} edit />;
    case "terms":
      return <TermsScreen />;
    case "terms-edit":
      return <TermsScreen edit />;
    case "reports":
      return <UnavailableScreen title="Reports" />;
    case "audit":
      return <UnavailableScreen title="Audit logs" />;
  }
}
function Missing() {
  return (
    <Screen>
      <Feedback error={new Error("INVALID_ID")} />
    </Screen>
  );
}

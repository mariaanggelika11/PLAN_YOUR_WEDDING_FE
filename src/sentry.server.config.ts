import * as Sentry from "@sentry/nextjs";
import { monitoringOptions } from "./shared/monitoring/options";
const dsn = process.env.SENTRY_DSN;
if (dsn) Sentry.init(monitoringOptions(dsn));

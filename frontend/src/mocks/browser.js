import { setupWorker } from "msw";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

// auto-start in dev if window is present
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  worker.start();
}

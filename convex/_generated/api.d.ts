/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as ai from "../ai.js";
import type * as aiSimple from "../aiSimple.js";
import type * as auth from "../auth.js";
import type * as events from "../events.js";
import type * as feedback from "../feedback.js";
import type * as feedbackHelpers from "../feedbackHelpers.js";
import type * as halls from "../halls.js";
import type * as http from "../http.js";
import type * as registrations from "../registrations.js";
import type * as router from "../router.js";
import type * as sessions from "../sessions.js";
import type * as users from "../users.js";
import type * as workflowHelpers from "../workflowHelpers.js";
import type * as workflows from "../workflows.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  aiSimple: typeof aiSimple;
  auth: typeof auth;
  events: typeof events;
  feedback: typeof feedback;
  feedbackHelpers: typeof feedbackHelpers;
  halls: typeof halls;
  http: typeof http;
  registrations: typeof registrations;
  router: typeof router;
  sessions: typeof sessions;
  users: typeof users;
  workflowHelpers: typeof workflowHelpers;
  workflows: typeof workflows;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

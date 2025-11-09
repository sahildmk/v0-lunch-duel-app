/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as discounts from "../discounts.js";
import type * as loyaltyCards from "../loyaltyCards.js";
import type * as pitches from "../pitches.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as teams from "../teams.js";
import type * as users from "../users.js";
import type * as visitHistory from "../visitHistory.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  discounts: typeof discounts;
  loyaltyCards: typeof loyaltyCards;
  pitches: typeof pitches;
  seed: typeof seed;
  sessions: typeof sessions;
  teams: typeof teams;
  users: typeof users;
  visitHistory: typeof visitHistory;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};

/**
 * Friendly aliases over the generated OpenAPI types. The generated file lives
 * at the repo root in `shared/openapi.d.ts`; we re-export the operation
 * response shapes here so call sites can write `serverFetch<AuthMeResponse>`
 * instead of digging through the `paths` index by hand.
 */
import type { paths } from "../../../shared/openapi.d.ts";

export type AuthMeResponse =
  paths["/auth/me"]["get"]["responses"]["200"]["content"]["application/json"];

export type ClaimFreeResponse =
  paths["/packs/{packId}/claim-free"]["post"]["responses"]["200"]["content"]["application/json"];

export type BotUrlResponse =
  paths["/packs/bot-url"]["get"]["responses"]["200"]["content"]["application/json"];

export type TelegramLinkStartResponse =
  paths["/auth/link/telegram/start"]["post"]["responses"]["200"]["content"]["application/json"];

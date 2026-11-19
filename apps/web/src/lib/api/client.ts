import createClient, { type Middleware } from "openapi-fetch";

import type { components, paths } from "./schema";

export type Schemas = components["schemas"];
export type Person = Schemas["PersonOut"];
export type LeaveSummary = Schemas["LeaveSummary"];
export type LeaveDetail = Schemas["LeaveDetail"];
export type Duty = Schemas["DutyOut"];
export type Assignment = Schemas["AssignmentOut"];
export type Finding = Schemas["FindingOut"];
export type ChangeRequest = Schemas["ChangeOut"];
export type ReturnView = Schemas["ReturnView"];
export type ReturnExplanation = Schemas["ReturnExplanation"];

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

let personaId: string | null = null;
export function setApiPersona(id: string | null) {
  personaId = id;
}

const persona: Middleware = {
  onRequest({ request }) {
    if (personaId) request.headers.set("X-Shetu-Persona", personaId);
    return request;
  },
};

export const api = createClient<paths>({ baseUrl: API_URL });
api.use(persona);

/** Turns an openapi-fetch error body into a readable message. */
export function errorMessage(error: unknown): string {
  if (!error) return "Something went wrong.";
  if (typeof error === "string") return error;
  const detail = (error as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: { message?: string; msg?: string }) => d.message ?? d.msg ?? "")
      .filter(Boolean)
      .join(" ");
  }
  if (detail && typeof detail === "object" && "message" in detail) {
    return String((detail as { message: string }).message);
  }
  return "Something went wrong.";
}

/** Unwraps an openapi-fetch result, throwing a readable Error on failure. */
export async function unwrap<T>(
  promise: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await promise;
  if (error !== undefined || data === undefined) {
    throw new Error(errorMessage(error) || `Request failed (${response.status}).`);
  }
  return data;
}

import { LOOKUP } from "../data/limits.js";
import { SOURCES } from "../data/registries.js";
import type { Check } from "./types.js";

const NS_RECORD = 2;
const NAME_DOES_NOT_EXIST = 3;

/**
 * Public DNS can prove a name is taken, because live name servers mean someone holds it.
 * It can't prove a name is free, because a registered name can have no DNS, so the most it says is "likely".
 */
export async function dnsCheck(ascii: string): Promise<Check | null> {
  const response = await fetch(`${SOURCES.dnsOverHttps}?name=${ascii}&type=NS`, {
    headers: { accept: "application/dns-json" },
    signal: AbortSignal.timeout(LOOKUP.dnsTimeout),
  });
  if (!response.ok) return null;
  const reply = (await response.json()) as { Status?: number; Answer?: { type?: number }[] };
  if (reply.Status === NAME_DOES_NOT_EXIST) return { status: "likely-free", source: "dns" };
  if (reply.Status === 0 && reply.Answer?.some((answer) => answer.type === NS_RECORD)) return { status: "taken", source: "dns" };
  return null;
}

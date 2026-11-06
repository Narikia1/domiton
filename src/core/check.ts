import { dnsCheck } from "./dns.js";
import { rdapCheck } from "./rdap.js";
import type { Check, Step } from "./types.js";
import { whoisCheck } from "./whois.js";

interface Sources {
  /** The registry's modern service, then its older one. */
  registry: Step[];
  dns: Step;
}

const SOURCES: Sources = { registry: [rdapCheck, whoisCheck], dns: dnsCheck };

async function ask(step: Step, ascii: string): Promise<Check | null> {
  try {
    return await step(ascii);
  } catch {
    return null; // This source could not be reached.
  }
}

/**
 * Telling someone a name is free when it isn't is the one mistake this app must not make.
 * So every "free" from a registry is checked against DNS, and live name servers overrule it.
 */
export async function checkDomain(ascii: string, sources: Sources = SOURCES): Promise<Check> {
  let fromRegistry: Check | null = null;
  for (const step of sources.registry) {
    fromRegistry = await ask(step, ascii);
    if (fromRegistry) break;
  }
  if (fromRegistry?.status === "taken") return fromRegistry;

  const fromDns = await ask(sources.dns, ascii);
  if (fromDns?.status === "taken") return fromDns;
  return fromRegistry ?? fromDns ?? { status: "unknown", source: "none" };
}

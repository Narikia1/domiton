/** The English messages: the source of truth for every key. Placeholders use {name}. */
export const en = {
  "meta.title": "{app}: is this domain name free?",
  "meta.description": "Check whether a domain name is free, and find similar names on the same ending.",
  "family.line": "A {company} app in the {family} family",
  "language.label": "Language",

  "search.label": "Domain name",
  "search.placeholder": "yourname.com",
  "search.submit": "Search",

  "idle.title": "Find your domain",
  "idle.lead": "See if a name is free, and get similar free names on the same ending. If you leave the ending out, {app} uses .com.",
  checking: "Checking",

  "action.visit": "Visit site",
  "action.newSearch": "New search",
  "action.get": "Get it",
  "action.getNamed": "Get it: {domain} at Hostinger",
  "action.copyNamed": "{action} {domain}",

  "copy.idle": "Copy",
  "copy.copied": "Copied",
  "copy.failed": "Can't copy",

  "status.free": "Free",
  "status.taken": "Taken",
  "status.likelyFree": "Probably free",
  "status.unknown": "Can't tell",

  "guide.title": "What the answers mean",
  "guide.free": "The registry has no record of this name.",
  "guide.likelyFree": "The registry doesn't answer lookups, but the name has no DNS. Confirm with a registrar.",
  "guide.taken": "The registry has a record, or the name has live DNS.",

  "answer.about": "About this answer",
  "answer.registration": "Registration",
  "answer.free": "The .{ending} registry has no record of this name. A registrar sets the final price, and some names are premium or reserved.",
  "answer.likelyFree": "The .{ending} registry doesn't answer public lookups, but this name has no DNS at all. Confirm with a registrar before you count on it.",
  "answer.unknown": "Neither the .{ending} registry nor public DNS answered. Search again in a minute.",
  "answer.takenDns": "It has live name servers, so someone holds it. The .{ending} registry doesn't share more.",
  "answer.takenRecord": "The .{ending} registry has a record of this name.",
  "fact.registered": "Registered",
  "fact.expires": "Expires",
  "fact.registrar": "Registrar",

  "similar.title": "Free on .{ending}",
  "similar.titleMixed": "Free or probably free on .{ending}",
  "similar.starting": "Checking similar names",
  "similar.running": "Checking {checked} of {total}",
  "similar.done": "{free} of {checked} tried",
  "similar.stopped": "The .{ending} registry stopped answering, so this search stopped. Try again in a minute.",
  "similar.none": "None of the {checked} similar names is free.",
  "similar.unconfirmed": "The .{ending} registry doesn't answer every lookup, so \"Probably free\" rests on DNS alone.",
  "similar.noAnswerOne": "1 name got no answer.",
  "similar.noAnswerMany": "{count} names got no answer.",

  "problem.empty": "Type a name first.",
  "problem.badName": "A name can use letters, numbers and hyphens, and can't start or end with a hyphen.",
  "problem.badEnding": ".{ending} isn't an ending that exists. Check the spelling.",
  "problem.tooMany": "That's too many searches in a minute. Wait a moment and search again.",
  "problem.offline": "Can't reach the lookup service. Check your connection and search again.",

  "affiliate.note": "\"Get it\" opens Hostinger through an affiliate link. A commission may be paid if you buy there.",
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;

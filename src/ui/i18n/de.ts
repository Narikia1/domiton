import type { Messages } from "./en.js";

/** The German messages, addressing people as "Sie", as in every Narikia app. */
export const de: Messages = {
  "meta.title": "{app}: Ist dieser Domainname frei?",
  "meta.description": "Prüfen Sie, ob ein Domainname frei ist, und finden Sie ähnliche Namen mit derselben Endung.",
  "family.line": "Eine {company}-App aus der {family}-Familie",
  "language.label": "Sprache",

  "search.label": "Domainname",
  "search.placeholder": "ihrname.de",
  "search.submit": "Suchen",

  "idle.title": "Finden Sie Ihre Domain",
  "idle.lead": "Prüfen Sie, ob ein Name frei ist, und erhalten Sie ähnliche freie Namen mit derselben Endung. Ohne Endung verwendet {app} .com.",
  checking: "Wird geprüft",

  "action.visit": "Website öffnen",
  "action.newSearch": "Neue Suche",
  "action.get": "Sichern",
  "action.getNamed": "{domain} bei Hostinger sichern",
  "action.copyNamed": "{domain}: {action}",

  "copy.idle": "Kopieren",
  "copy.copied": "Kopiert",
  "copy.failed": "Nicht kopiert",

  "status.free": "Frei",
  "status.taken": "Vergeben",
  "status.likelyFree": "Wahrscheinlich frei",
  "status.unknown": "Unklar",

  "guide.title": "Was die Antworten bedeuten",
  "guide.free": "Die Registry hat keinen Eintrag zu diesem Namen.",
  "guide.likelyFree": "Die Registry beantwortet keine Abfragen, aber der Name hat kein DNS. Prüfen Sie das bei einem Registrar.",
  "guide.taken": "Die Registry hat einen Eintrag, oder der Name hat aktives DNS.",

  "answer.about": "Zu dieser Antwort",
  "answer.registration": "Registrierung",
  "answer.free": "Die Registry für .{ending} hat keinen Eintrag zu diesem Namen. Den endgültigen Preis legt der Registrar fest, und manche Namen sind Premium-Namen oder reserviert.",
  "answer.likelyFree": "Die Registry für .{ending} beantwortet keine öffentlichen Abfragen, aber dieser Name hat überhaupt kein DNS. Prüfen Sie das bei einem Registrar, bevor Sie sich darauf verlassen.",
  "answer.unknown": "Weder die Registry für .{ending} noch das öffentliche DNS haben geantwortet. Suchen Sie in einer Minute noch einmal.",
  "answer.takenDns": "Der Name hat aktive Nameserver, also gehört er jemandem. Die Registry für .{ending} teilt nicht mehr mit.",
  "answer.takenRecord": "Die Registry für .{ending} hat einen Eintrag zu diesem Namen.",
  "fact.registered": "Registriert",
  "fact.expires": "Läuft ab",
  "fact.registrar": "Registrar",

  "similar.title": "Frei mit .{ending}",
  "similar.titleMixed": "Frei oder wahrscheinlich frei mit .{ending}",
  "similar.starting": "Ähnliche Namen werden geprüft",
  "similar.running": "{checked} von {total} geprüft",
  "similar.done": "{free} von {checked} frei",
  "similar.stopped": "Die Registry für .{ending} antwortet nicht mehr, daher wurde die Suche beendet. Versuchen Sie es in einer Minute noch einmal.",
  "similar.none": "Keiner der {checked} ähnlichen Namen ist frei.",
  "similar.unconfirmed": "Die Registry für .{ending} beantwortet nicht jede Abfrage, daher beruht „Wahrscheinlich frei“ nur auf DNS.",
  "similar.noAnswerOne": "1 Name blieb ohne Antwort.",
  "similar.noAnswerMany": "{count} Namen blieben ohne Antwort.",

  "problem.empty": "Geben Sie zuerst einen Namen ein.",
  "problem.badName": "Ein Name darf Buchstaben, Zahlen und Bindestriche enthalten, aber nicht mit einem Bindestrich beginnen oder enden.",
  "problem.badEnding": ".{ending} ist keine existierende Endung. Prüfen Sie die Schreibweise.",
  "problem.tooMany": "Zu viele Suchen in einer Minute. Warten Sie kurz und suchen Sie noch einmal.",
  "problem.offline": "Der Abfragedienst ist nicht erreichbar. Prüfen Sie Ihre Verbindung und suchen Sie noch einmal.",

  "affiliate.note": "„Sichern“ öffnet Hostinger über einen Affiliate-Link. Wenn Sie dort kaufen, kann dafür eine Provision gezahlt werden.",
};

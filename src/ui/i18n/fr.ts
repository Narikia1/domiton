import type { Messages } from "./en.js";

/** The French messages, with non-breaking spaces where French typography needs them. */
export const fr: Messages = {
  "meta.title": "{app} : ce nom de domaine est-il libre ?",
  "meta.description": "Vérifiez si un nom de domaine est libre et trouvez des noms similaires avec la même extension.",
  "family.line": "Une application {company} de la famille {family}",
  "language.label": "Langue",

  "search.label": "Nom de domaine",
  "search.placeholder": "votrenom.fr",
  "search.submit": "Rechercher",

  "idle.title": "Trouvez votre domaine",
  "idle.lead": "Vérifiez si un nom est libre et obtenez des noms libres similaires avec la même extension. Sans extension, {app} utilise .com.",
  checking: "Vérification",

  "action.visit": "Visiter le site",
  "action.newSearch": "Nouvelle recherche",
  "action.get": "Réserver",
  "action.getNamed": "Réserver {domain} chez Hostinger",
  "action.copyNamed": "{action} {domain}",

  "copy.idle": "Copier",
  "copy.copied": "Copié",
  "copy.failed": "Échec de la copie",

  "status.free": "Libre",
  "status.taken": "Déjà pris",
  "status.likelyFree": "Probablement libre",
  "status.unknown": "Indéterminé",

  "guide.title": "Ce que signifient les réponses",
  "guide.free": "Le registre n’a aucune trace de ce nom.",
  "guide.likelyFree": "Le registre ne répond pas aux requêtes, mais ce nom n’a aucun DNS. Confirmez auprès d’un bureau d’enregistrement.",
  "guide.taken": "Le registre en a une trace, ou ce nom a un DNS actif.",

  "answer.about": "À propos de cette réponse",
  "answer.registration": "Enregistrement",
  "answer.free": "Le registre de .{ending} n’a aucune trace de ce nom. Le bureau d’enregistrement fixe le prix final, et certains noms sont premium ou réservés.",
  "answer.likelyFree": "Le registre de .{ending} ne répond pas aux requêtes publiques, mais ce nom n’a aucun DNS. Confirmez auprès d’un bureau d’enregistrement avant d’y compter.",
  "answer.unknown": "Ni le registre de .{ending} ni le DNS public n’ont répondu. Réessayez dans une minute.",
  "answer.takenDns": "Il a des serveurs de noms actifs : quelqu’un le détient. Le registre de .{ending} n’en dit pas plus.",
  "answer.takenRecord": "Le registre de .{ending} a une trace de ce nom.",
  "fact.registered": "Enregistré le",
  "fact.expires": "Expire le",
  "fact.registrar": "Bureau d’enregistrement",

  "similar.title": "Libre en .{ending}",
  "similar.titleMixed": "Libre ou probablement libre en .{ending}",
  "similar.starting": "Vérification des noms similaires",
  "similar.running": "{checked} sur {total} vérifiés",
  "similar.done": "{free} sur {checked} essayés",
  "similar.stopped": "Le registre de .{ending} ne répond plus, la recherche s’est donc arrêtée. Réessayez dans une minute.",
  "similar.none": "Aucun des {checked} noms similaires n’est libre.",
  "similar.unconfirmed": "Le registre de .{ending} ne répond pas à toutes les requêtes : « Probablement libre » repose donc uniquement sur le DNS.",
  "similar.noAnswerOne": "1 nom est resté sans réponse.",
  "similar.noAnswerMany": "{count} noms sont restés sans réponse.",

  "problem.empty": "Saisissez d’abord un nom.",
  "problem.badName": "Un nom peut contenir des lettres, des chiffres et des tirets, mais ne peut pas commencer ni finir par un tiret.",
  "problem.badEnding": ".{ending} n’est pas une extension existante. Vérifiez l’orthographe.",
  "problem.tooMany": "Trop de recherches en une minute. Patientez un instant, puis réessayez.",
  "problem.offline": "Impossible de joindre le service de recherche. Vérifiez votre connexion, puis réessayez.",

  "affiliate.note": "« Réserver » ouvre Hostinger via un lien d’affiliation. Une commission peut être versée si vous y achetez.",
};

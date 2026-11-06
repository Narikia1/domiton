import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: Variant;
  /** A round button holding only an icon. It needs an aria-label. */
  iconOnly?: boolean;
}

function classes(variant: Variant, iconOnly: boolean, extra: string) {
  return ["button", `button-${variant}`, iconOnly ? "button-icon" : "type-button-md", extra].filter(Boolean).join(" ");
}

/**
 * Primary buttons hold icons only: white on Narikia Blue measures 3.56:1, which is enough for
 * icons and large text but not for a small label. Secondary buttons carry the words.
 */
export function Button({ variant, iconOnly = false, className = "", ...props }: ButtonProps) {
  return <button type="button" className={classes(variant, iconOnly, className)} {...props} />;
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant: Variant;
  href: string;
}

/** Looks like a button, and goes to another page. */
export function ButtonLink({ variant, className = "", ...props }: ButtonLinkProps) {
  return <a className={classes(variant, false, className)} {...props} />;
}

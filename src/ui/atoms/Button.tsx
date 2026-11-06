import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: "primary" | "secondary";
  /** A round button holding only an icon. It needs an aria-label. */
  iconOnly?: boolean;
}

/**
 * Primary buttons hold icons only: white on Narikia Blue measures 3.56:1, which is enough for
 * icons and large text but not for a small label. Secondary buttons carry the words.
 */
export function Button({ variant, iconOnly = false, className = "", ...props }: ButtonProps) {
  const classes = ["button", `button-${variant}`, iconOnly ? "button-icon" : "type-button-md", className].filter(Boolean).join(" ");
  return <button type="button" className={classes} {...props} />;
}

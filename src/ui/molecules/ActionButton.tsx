import { Icon, type IconName } from "../atoms/Icon.js";

type ActionButtonProps = { icon: IconName; label: string } & ({ onClick: () => void; href?: never } | { href: string; onClick?: never });

/** A round icon with its label underneath. It opens a page in the browser when given an address. */
export function ActionButton({ icon, label, onClick, href }: ActionButtonProps) {
  const content = (
    <>
      <span className="action-circle">
        <Icon name={icon} />
      </span>
      <span className="type-label-md">{label}</span>
    </>
  );
  return href ? (
    <a className="action" href={href} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    <button className="action" type="button" onClick={onClick}>
      {content}
    </button>
  );
}

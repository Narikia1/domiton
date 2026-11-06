import { StatusDot } from "../atoms/Status.js";

/** Ink beside a red dot, because the brand's red only reaches AA contrast as large text. */
export function ProblemNotice({ message }: { message: string }) {
  return (
    <p className="problem-notice type-body-md" role="alert">
      <StatusDot tone="danger" />
      {message}
    </p>
  );
}

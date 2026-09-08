import { classNames } from "@/utils/helpers";

type BadgeProps = {
  children: React.ReactNode;
  color?: "green" | "red" | "slate" | "amber";
};

const colors = {
  green: "bg-brand-100 text-brand-800",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-100 text-slate-600",
  amber: "bg-amber-100 text-amber-800"
};

export function Badge({ children, color = "slate" }: BadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        colors[color]
      )}
    >
      {children}
    </span>
  );
}
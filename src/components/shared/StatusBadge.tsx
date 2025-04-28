import { LoanStatus } from "@/types";
import { getStatusColor, getStatusName } from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: LoanStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const { textColor, bgColor } = getStatusColor(status);
  const displayName = getStatusName(status);

  return (
    <span
      className={cn(
        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
        bgColor,
        textColor,
        className
      )}
    >
      {displayName}
    </span>
  );
}

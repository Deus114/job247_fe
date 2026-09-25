export interface SortHeaderProps {
  label: string;
  field: string;
  currentField: string;
  currentOrder: "asc" | "desc";
  onSort: (field: string) => void;
  className?: string;
}

export default function SortHeader({
  label,
  field,
  currentField,
  currentOrder,
  onSort,
  className = "",
}: SortHeaderProps) {
  const isActive = currentField === field;
  return (
    <th
      className={`text-left px-5 py-3 text-xs font-semibold text-foreground-500 cursor-pointer select-none hover:text-foreground-700 transition-colors ${className}`}
      onClick={() => onSort(field)}
    >
      {label}
      {isActive && (
        <i
          className={`ml-1 ${currentOrder === "asc" ? "ri-arrow-up-line" : "ri-arrow-down-line"}`}
        ></i>
      )}
    </th>
  );
}

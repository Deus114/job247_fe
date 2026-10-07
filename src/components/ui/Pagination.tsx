import { useTranslation } from "react-i18next";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  /** Hide the per-page size controls (fixed page size). */
  hidePageSize?: boolean;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  hidePageSize = false,
  className = "",
}: PaginationProps) {
  const { t } = useTranslation();
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const pageSizeOptions = [10, 20, 50];
  const showPageSize = !hidePageSize && typeof onPageSizeChange === "function";

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-background-200/70 ${className}`}
    >
      <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
        <span className="text-xs text-foreground-500">
          {t("common.showing")}{" "}
          <strong className="text-foreground-700">
            {start}-{end}
          </strong>{" "}
          / <strong className="text-foreground-700">{totalItems}</strong>{" "}
          {t("common.items", "mục")}
        </span>
        {showPageSize ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-foreground-400">
              {t("common.perPage")}:
            </span>
            {pageSizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onPageSizeChange(size)}
                className={`px-2 py-1 text-xs rounded-lg transition-colors cursor-pointer min-h-[32px] ${
                  pageSize === size
                    ? "bg-primary-100 text-primary-700 font-medium"
                    : "text-foreground-500 hover:bg-background-100"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-sm text-foreground-600 hover:bg-background-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-s-line"></i>
        </button>
        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="w-8 h-8 flex items-center justify-center text-sm text-foreground-400"
            >
              ...
            </span>
          ) : (
            <button
              type="button"
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                currentPage === p
                  ? "bg-primary-500 text-white"
                  : "text-foreground-600 hover:bg-background-100"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-sm text-foreground-600 hover:bg-background-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <i className="ri-arrow-right-s-line"></i>
        </button>
      </div>
    </div>
  );
}

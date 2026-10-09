import { useEffect, useState } from "react";
import { subscribeToasts, type ToastItem } from "@/lib/toast";

export default function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setItems), []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-[min(100vw-2rem,380px)] pointer-events-none">
      {items.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm ${
            item.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : item.type === "info"
                ? "bg-background-50 border-background-200 text-foreground-900"
                : "bg-red-50 border-red-200 text-red-700"
          }`}
          role="status"
        >
          <i
            className={`text-base flex-shrink-0 mt-px ${
              item.type === "success"
                ? "ri-checkbox-circle-fill text-emerald-600"
                : item.type === "info"
                  ? "ri-notification-3-fill text-primary-500"
                  : "ri-error-warning-fill text-red-500"
            }`}
          />
          <span className="leading-snug">{item.message}</span>
        </div>
      ))}
    </div>
  );
}

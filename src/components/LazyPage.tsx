import { Suspense } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageLoader from "@/components/ui/PageLoader";

export default function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

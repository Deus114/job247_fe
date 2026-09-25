export default function SkeletonCard() {
  return (
    <div className="bg-background-50 border border-background-200/70 rounded-xl p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-background-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-background-200 rounded w-3/4" />
          <div className="h-3 bg-background-200 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <div className="h-3 bg-background-200 rounded w-20" />
        <div className="h-3 bg-background-200 rounded w-24" />
        <div className="h-3 bg-background-200 rounded w-16" />
      </div>
      <div className="flex gap-2 mt-3">
        <div className="h-5 bg-background-200 rounded-full w-24" />
        <div className="h-5 bg-background-200 rounded-full w-20" />
      </div>
      <div className="mt-auto pt-4 border-t border-background-200/70 flex items-center justify-between">
        <div className="h-3 bg-background-200 rounded w-24" />
        <div className="h-3 bg-background-200 rounded w-16" />
      </div>
    </div>
  );
}

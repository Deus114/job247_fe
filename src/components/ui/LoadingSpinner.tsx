export default function LoadingSpinner({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-10 h-10 border-3 border-background-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );
}

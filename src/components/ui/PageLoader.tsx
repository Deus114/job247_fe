import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function PageLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}

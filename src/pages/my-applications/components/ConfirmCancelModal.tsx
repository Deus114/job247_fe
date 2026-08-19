interface ConfirmCancelModalProps {
  jobTitle: string;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmCancelModal({
  jobTitle,
  companyName,
  isOpen,
  onClose,
  onConfirm,
}: ConfirmCancelModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-background-50 rounded-2xl w-full max-w-md p-6 md:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
            <i className="ri-delete-bin-line text-2xl text-red-500"></i>
          </div>
          <h3 className="text-lg font-heading font-bold text-foreground-950 mb-2">Hủy đơn ứng tuyển?</h3>
          <p className="text-sm text-foreground-600">
            Bạn có chắc muốn hủy đơn ứng tuyển vào vị trí{' '}
            <strong className="text-foreground-900">{jobTitle}</strong> tại{' '}
            <strong className="text-foreground-900">{companyName}</strong>?
          </p>
          <p className="text-xs text-foreground-400 mt-2">Hành động này không thể hoàn tác.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-background-100 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-200/70 transition-colors cursor-pointer whitespace-nowrap"
          >
            Giữ lại
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-close-line mr-1.5"></i>Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
}
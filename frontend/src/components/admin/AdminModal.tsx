type AdminModalProps = {
  title: string
  children: React.ReactNode
  onClose: () => void
}

function AdminModal({ title, children, onClose }: AdminModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-sm rounded-xl border border-blue-200 bg-white p-6 shadow-[0_20px_50px_rgba(30,41,59,0.2)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-500"
          >
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

export default AdminModal

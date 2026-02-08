type JoinModalProps = {
  groupName: string
  isJoining: boolean
  onCancel: () => void
  onConfirm: () => void
}

function JoinModal({ groupName, isJoining, onCancel, onConfirm }: JoinModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-sm rounded-xl border border-blue-200 bg-white p-6 shadow-[0_20px_50px_rgba(30,41,59,0.2)]">
        <h2 className="text-lg font-semibold text-slate-900">Join group</h2>
        <p className="mt-2 text-sm text-slate-600">
          Join <span className="font-semibold">{groupName}</span> to view messages.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold text-slate-600"
            disabled={isJoining}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            disabled={isJoining}
          >
            {isJoining ? 'Joining...' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default JoinModal

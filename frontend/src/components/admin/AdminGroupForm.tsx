type AdminGroupFormProps = {
  name: string
  description: string
  error: string
  isLoading: boolean
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

function AdminGroupForm({
  name,
  description,
  error,
  isLoading,
  onNameChange,
  onDescriptionChange,
  onSubmit,
}: AdminGroupFormProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <h1 className="text-xl font-semibold text-slate-900">Create group</h1>
      <p className="mt-1 text-sm text-slate-500">
        Start a new space for discussions and announcements.
      </p>
      <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-600">Group name</label>
          <input
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-600">Description</label>
          <input
            type="text"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create group'}
        </button>
      </form>
    </div>
  )
}

export default AdminGroupForm

import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/16/solid'
import { useEffect } from 'react'

type ToastProps = {
    message: string
    type?: 'success' | 'error'
    onClose: () => void
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000)
        return () => clearTimeout(timer)
    }, [onClose])

    const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500'

    return (
        <div className={`fixed bottom-4 left-4 right-4 z-[100] flex items-center justify-between gap-3 rounded-lg ${bgColor} px-4 py-3 text-white shadow-lg transition-all animate-in fade-in slide-in-from-bottom-5 lg:left-auto lg:right-8 lg:bottom-8 lg:w-80`}>
            <div className="flex items-center gap-2">
                {type === 'success' ? (
                    <CheckCircleIcon className="h-5 w-5 shrink-0" />
                ) : null}
                <span className="text-sm font-medium">{message}</span>
            </div>
            <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-white/20 transition-colors"
            >
                <XMarkIcon className="h-4 w-4" />
            </button>
        </div>
    )
}

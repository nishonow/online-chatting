function parseUTC(dateStr: string): Date {
    // If the string doesn't have a timezone indicator, assume UTC
    if (!dateStr.includes('Z') && !dateStr.includes('+')) {
        return new Date(dateStr + 'Z')
    }
    return new Date(dateStr)
}

export function formatRelativeTime(dateStr: string): string {
    const date = parseUTC(dateStr)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
        return 'just now'
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
        return `${diffInHours}h ago`
    }

    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    })
}

export function formatDayLabel(dateStr: string): string {
    const date = parseUTC(dateStr)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)

    if (isSameDay(date, now)) {
        return 'Today'
    }

    if (isSameDay(date, yesterday)) {
        return 'Yesterday'
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
}

export function isSameDay(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? parseUTC(date1) : date1
    const d2 = typeof date2 === 'string' ? parseUTC(date2) : date2

    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    )
}

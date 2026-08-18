const ATTENDED_KEY = "pulse_attended"
const VOLUNTEER_HOURS_KEY = "pulse_volunteer_hours"

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export interface AttendedEvent {
  id: string
  title: string
  time: string
}

export function getAttendedEvents(): AttendedEvent[] {
  return read<AttendedEvent>(ATTENDED_KEY)
}

export function attendEvent(event: { id: string; title: string; time: string }) {
  const all = [...getAttendedEvents(), event]
  write(ATTENDED_KEY, all)
}

export function getVolunteerHours(): number {
  if (typeof window === "undefined") return 0
  return Number(window.localStorage.getItem(VOLUNTEER_HOURS_KEY) ?? "0")
}

export function addVolunteerHours(hours: number) {
  if (typeof window === "undefined") return
  const total = getVolunteerHours() + hours
  window.localStorage.setItem(VOLUNTEER_HOURS_KEY, String(total))
}

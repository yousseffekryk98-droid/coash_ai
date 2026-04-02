import { Dumbbell, FileText } from 'lucide-react'
import { useMemo, useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import type { GymLog } from '../types'

type AttendanceCalendarProps = {
  logs: GymLog[]
}

type CalendarValue = Date | null

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10)

export default function AttendanceCalendar({ logs }: AttendanceCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const logsByDate = useMemo(() => new Map(logs.map((log) => [log.date, log])), [logs])
  const selectedLog = logsByDate.get(toIsoDate(selectedDate))

  return (
    <section className="glass-panel card-entrance p-4 md:p-5">
      <h2 className="text-lg font-bold">Attendance Calendar</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Green: completed session. Red: missed/rest day. Note icon: coach note available.</p>

      <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-2">
        <Calendar
          onChange={(value) => setSelectedDate((value as CalendarValue) ?? new Date())}
          value={selectedDate}
          tileContent={({ date }) => {
            const item = logsByDate.get(toIsoDate(date))
            if (!item) return null

            return (
              <div className="mt-1 flex items-center justify-center gap-1">
                <span className={`h-2.5 w-2.5 rounded-full ${item.workout_completed ? 'bg-[var(--ok)]' : 'bg-[var(--bad)]'}`} />
                {item.notes ? <FileText size={12} className="text-[var(--muted)]" /> : <Dumbbell size={12} className="text-[var(--muted)]" />}
              </div>
            )
          }}
        />
      </div>

      <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-sm">
        <p className="font-semibold">{selectedDate.toDateString()}</p>
        <p className="text-[var(--muted)]">
          {selectedLog
            ? selectedLog.workout_completed
              ? 'Workout completed.'
              : 'Rest or missed session.'
            : 'No log for this date.'}
        </p>
        {selectedLog?.notes && <p className="mt-1">Coach note: {selectedLog.notes}</p>}
      </div>
    </section>
  )
}

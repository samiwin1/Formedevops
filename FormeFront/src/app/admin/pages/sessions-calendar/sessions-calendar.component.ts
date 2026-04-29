import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { RouterLink } from '@angular/router';
import { OralSession } from '../../../core/models/certification.models';
import { OralSessionService } from '../../../core/services/oral-session.service';

interface DayGroup {
  date: string;
  label: string;
  sessions: OralSession[];
}

@Component({
  standalone: true,
  selector: 'app-sessions-calendar',
  imports: [CommonModule, FullCalendarModule, RouterLink],
  templateUrl: './sessions-calendar.component.html',
  styleUrl: './sessions-calendar.component.css',
})
export class SessionsCalendarComponent implements OnInit {
  private readonly oralSessionService = inject(OralSessionService);

  sessions: OralSession[] = [];
  dayGroups: DayGroup[] = [];
  calendarEvents: EventInput[] = [];
  loading = false;
  error: string | null = null;
  showListView = false;

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    eventClick: (info) => {
      info.jsEvent.preventDefault();
      this.showListView = true;
    },
    slotMinTime: '06:00:00',
    slotMaxTime: '22:00:00',
    height: 'auto',
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.oralSessionService.list().subscribe({
      next: (list) => {
        this.sessions = list;
        this.dayGroups = this.groupByDate(list);
        this.calendarEvents = list.map((s) => this.sessionToEvent(s));
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load sessions';
        this.loading = false;
      },
    });
  }

  private sessionToEvent(s: OralSession): EventInput {
    const start = new Date(s.scheduledAt);
    const end = new Date(start.getTime() + (s.durationMinutes ?? 60) * 60 * 1000);
    return {
      id: String(s.id),
      title: s.title || s.certificationTitle || `Session #${s.id}`,
      start: start.toISOString(),
      end: end.toISOString(),
      extendedProps: { session: s },
    };
  }

  private groupByDate(sessions: OralSession[]): DayGroup[] {
    const byDate = new Map<string, OralSession[]>();
    for (const s of sessions) {
      const d = s.scheduledAt.slice(0, 10);
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(s);
    }
    for (const arr of byDate.values()) {
      arr.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    }
    const sortedDates = Array.from(byDate.keys()).sort();
    return sortedDates.map((date) => ({
      date,
      label: this.formatDateLabel(date),
      sessions: byDate.get(date)!,
    }));
  }

  private formatDateLabel(isoDate: string): string {
    const d = new Date(isoDate + 'T12:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
}

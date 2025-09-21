import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Trip, TripDataService } from '../trip-data.service';

type Toast = { id: number; msg: string; kind: 'ok' | 'err' };

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trip-list.component.html'
})
export class TripListComponent implements OnInit {
  trips: Trip[] = [];

  // Add row form
  addForm: any = { title: '', location: '', description: '', price: 0, date: '' };

  // Inline edit state
  editingId: string | null = null;
  editForm: any = {};

  // UX helpers
  loading = false;
  saving = false;
  creating = false;
  deletingId: string | null = null;

  toasts: Toast[] = [];
  private toastSeq = 1;

  constructor(private svc: TripDataService) { }

  ngOnInit() {
    // restore theme
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    this.reload();
  }

  /* ------------ Theme ------------ */
  toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    this.toast(`Theme: ${next}`, 'ok');
  }

  /* ------------ Toasts ------------ */
  toast(msg: string, kind: 'ok' | 'err' = 'ok', ms = 2600) {
    const id = this.toastSeq++;
    this.toasts.push({ id, msg, kind });
    setTimeout(() => this.toasts = this.toasts.filter(t => t.id !== id), ms);
  }

  /* ------------ Data ------------ */
  reload() {
    this.loading = true;
    this.svc.getTrips().subscribe({
      next: (list) => { this.trips = list || []; this.loading = false; },
      error: (err) => {
        this.loading = false;
        console.error('[GET trips error]', err);
        this.toast(`Failed to load trips: ${err.status} ${err.statusText}`, 'err', 4000);
      }
    });
  }

  // Begin editing a row
  startEdit(t: any) {
    this.editingId = t?._id ?? null;
    const dateStr = t?.date ? new Date(t.date).toISOString().slice(0, 10) : '';
    this.editForm = {
      _id: t?._id,
      title: (t?.title ?? '').trim(),
      location: (t?.location ?? '').trim(),
      description: (t?.description ?? '').trim(),
      price: Number(t?.price ?? 0),
      date: dateStr
    };
  }

  cancelEdit() {
    this.editingId = null;
    this.editForm = {};
  }

  // Helper: build payload
  private buildPayload(src: any): any {
    const payload: any = {
      title: (src.title ?? '').trim(),
      location: (src.location ?? '').trim(),
      description: (src.description ?? '').trim(),
      price: Number(src.price ?? 0)
    };
    const d = (src.date ?? '').trim();
    if (d) {
      const iso = new Date(`${d}T00:00:00.000Z`).toISOString();
      if (!isNaN(Date.parse(iso))) payload.date = iso;
    }
    return payload;
  }

  /* ------------ Save / Create / Delete ------------ */
  saveEdit() {
    const id: string | undefined = this.editForm?._id || (this.editingId as any);
    if (!id) { this.toast('Cannot save: row has no _id', 'err'); return; }

    const payload = this.buildPayload(this.editForm);
    if (!payload.title) { this.toast('Title is required', 'err'); return; }

    this.saving = true;
    this.svc.updateTrip(id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.reload();
        this.toast('Trip updated', 'ok');
      },
      error: (err) => {
        this.saving = false;
        console.error('[PUT] error', err);
        this.toast(`Save failed: ${err.status} ${err.statusText}`, 'err', 4000);
      }
    });
  }

  add() {
    const payload = this.buildPayload(this.addForm);
    if (!payload.title) { this.toast('Title is required', 'err'); return; }

    this.creating = true;
    this.svc.addTrip(payload).subscribe({
      next: () => {
        this.creating = false;
        this.addForm = { title: '', location: '', description: '', price: 0, date: '' };
        this.reload();
        this.toast('Trip created', 'ok');
      },
      error: (err) => {
        this.creating = false;
        console.error('[POST] error', err);
        this.toast(`Create failed: ${err.status} ${err.statusText}`, 'err', 4000);
      }
    });
  }

  remove(t: any) {
    const id = t?._id;
    if (!id) { this.toast('Cannot delete: row has no _id', 'err'); return; }
    if (!confirm(`Delete "${t.title || 'this trip'}"?`)) return;

    this.deletingId = id;
    this.svc.deleteTrip(id).subscribe({
      next: () => {
        this.deletingId = null;
        this.reload();
        this.toast('Trip deleted', 'ok');
      },
      error: (err) => {
        this.deletingId = null;
        console.error('[DELETE] error', err);
        this.toast(`Delete failed: ${err.status} ${err.statusText}`, 'err', 4000);
      }
    });
  }
}

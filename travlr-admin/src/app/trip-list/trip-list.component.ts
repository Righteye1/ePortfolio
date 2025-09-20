import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Trip, TripDataService } from '../trip-data.service';

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trip-list.component.html'
})
export class TripListComponent implements OnInit {
  trips: Trip[] = [];

  // Add row form at the top of the table
  addForm: any = { title: '', location: '', description: '', price: 0, date: '' };

  // Inline edit state
  editingId: string | null = null;
  editForm: any = {};

  constructor(private svc: TripDataService) { }

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.svc.getTrips().subscribe({
      next: (list) => { this.trips = list || []; },
      error: (err) => {
        console.error('[GET trips error]', err);
        alert(`Failed to load trips: ${err.status} ${err.statusText}`);
      }
    });
  }

  // Begin editing a row
  startEdit(t: any) {
    this.editingId = t?._id ?? null;

    // If an ISO date exists, show it as YYYY-MM-DD in the input; else show empty
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

  // Helper: build payload, omitting empty/invalid date and normalizing strings
  private buildPayload(src: any): any {
    const payload: any = {
      title: (src.title ?? '').trim(),
      location: (src.location ?? '').trim(),
      description: (src.description ?? '').trim(),
      price: Number(src.price ?? 0)
    };

    const d = (src.date ?? '').trim();
    if (d) {
      // Convert YYYY-MM-DD -> ISO 8601
      const iso = new Date(`${d}T00:00:00.000Z`).toISOString();
      if (!isNaN(Date.parse(iso))) {
        payload.date = iso;
      }
      // If parse fails, we simply omit date so backend won't reject it
    }

    return payload;
  }

  // Save current edit row
  saveEdit() {
    const id: string | undefined = this.editForm?._id || (this.editingId as any);
    if (!id) {
      alert('Cannot save: this trip has no _id (older/legacy row). Create a new one with Add Trip, then delete the old row.');
      return;
    }

    const payload = this.buildPayload(this.editForm);
    if (!payload.title) {
      alert('Title is required.');
      return;
    }

    this.svc.updateTrip(id, payload).subscribe({
      next: () => {
        this.cancelEdit();
        this.reload();
      },
      error: (err) => {
        console.error('[PUT /api/trips/:id error]', err);
        alert(`Save failed: ${err.status} ${err.statusText}\n${JSON.stringify(err.error)}`);
      }
    });
  }

  // Add a new trip from the top row
  add() {
    const payload = this.buildPayload(this.addForm);
    if (!payload.title) {
      alert('Title is required.');
      return;
    }

    this.svc.addTrip(payload).subscribe({
      next: () => {
        this.addForm = { title: '', location: '', description: '', price: 0, date: '' };
        this.reload();
      },
      error: (err) => {
        console.error('[POST /api/trips error]', err);
        alert(`Create failed: ${err.status} ${err.statusText}\n${JSON.stringify(err.error)}`);
      }
    });
  }

  // Delete row
  remove(t: any) {
    const id = t?._id;
    if (!id) {
      alert('Cannot delete: this trip has no _id (older/legacy row).');
      return;
    }

    this.svc.deleteTrip(id).subscribe({
      next: () => this.reload(),
      error: (err) => {
        console.error('[DELETE /api/trips/:id error]', err);
        alert(`Delete failed: ${err.status} ${err.statusText}\n${JSON.stringify(err.error)}`);
      }
    });
  }
}

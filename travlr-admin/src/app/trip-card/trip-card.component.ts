import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Trip, TripDataService } from '../trip-data.service';

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trip-card.component.html'
})
export class TripCardComponent {
  @Input() trip!: Trip;          // provided by parent list
  editing = false;               // toggled by Edit/Cancel

  constructor(private tripDataService: TripDataService) { }

  edit() { this.editing = true; }
  cancel() { this.editing = false; }

  save() {
    const id = (this.trip as any)?._id;
    if (!id) {
      alert('Cannot save: missing _id on trip.');
      return;
    }

    const payload: Trip = {
      title: this.trip.title ?? '',
      location: (this.trip as any).location ?? '',
      description: this.trip.description ?? '',
      price: Number(this.trip.price ?? 0),
      date: (this.trip as any).date
    };

    this.tripDataService.updateTrip(id, payload).subscribe({
      next: () => {
        this.editing = false;
        // force visible refresh so you immediately see changes
        location.reload();
      },
      error: (err) => {
        console.error('[PUT error]', err);
        alert(`Save failed: ${err.status} ${err.statusText}\n${JSON.stringify(err.error)}`);
      }
    });
  }

  delete() {
    const id = (this.trip as any)?._id;
    if (!id) {
      alert('Cannot delete: missing _id on trip.');
      return;
    }

    this.tripDataService.deleteTrip(id).subscribe({
      next: () => {
        location.reload();
      },
      error: (err) => {
        console.error('[DELETE error]', err);
        alert(`Delete failed: ${err.status} ${err.statusText}\n${JSON.stringify(err.error)}`);
      }
    });
  }
}

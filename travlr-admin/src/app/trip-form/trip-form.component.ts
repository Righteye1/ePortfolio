import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Trip, TripDataService } from '../trip-data.service';

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trip-form.component.html'
})
export class TripFormComponent {
  // form model bound from the template
  model: Trip = { title: '', location: '', description: '', price: 0, date: '' };

  constructor(private tripDataService: TripDataService) { }

  addTrip() {
    const payload: Trip = {
      title: this.model.title ?? '',
      location: (this.model as any).location ?? '',
      description: this.model.description ?? '',
      price: Number(this.model.price ?? 0),
      date: (this.model as any).date
    };

    if (!payload.title.trim()) {
      alert('Title is required.');
      return;
    }

    this.tripDataService.addTrip(payload).subscribe({
      next: () => {
        // clear the form and visibly refresh
        this.model = { title: '', location: '', description: '', price: 0, date: '' };
        location.reload();
      },
      error: (err) => {
        console.error('[POST error]', err);
        alert(`Create failed: ${err.status} ${err.statusText}\n${JSON.stringify(err.error)}`);
      }
    });
  }
}

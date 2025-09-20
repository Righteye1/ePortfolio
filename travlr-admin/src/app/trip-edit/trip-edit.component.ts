import { Component, Input } from '@angular/core';
import { Trip, TripDataService } from '../trip-data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-trip-edit',
  templateUrl: './trip-edit.component.html',
  styleUrls: ['./trip-edit.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TripEditComponent {
  @Input() trip!: Trip;
  editing: boolean = false;

  constructor(private tripService: TripDataService) {}

  updateTrip() {
    this.tripService.updateTrip(this.trip._id!, this.trip).subscribe(() => {
      alert('Trip updated!');
      this.editing = false;
    });
  }

  deleteTrip() {
    if (confirm('Are you sure you want to delete this trip?')) {
      this.tripService.deleteTrip(this.trip._id!).subscribe(() => {
        alert('Trip deleted!');
      });
    }
  }
}

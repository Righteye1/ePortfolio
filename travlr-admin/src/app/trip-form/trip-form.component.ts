import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TripDataService } from '../trip-data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './trip-form.component.html',
  styleUrls: ['./trip-form.component.css']
})
export class TripFormComponent {
  tripForm: FormGroup;
  message = '';

  constructor(private fb: FormBuilder, private api: TripDataService) {
    this.tripForm = this.fb.group({
      name: ['', Validators.required],          // ✅ name, not title
      destination: ['', Validators.required],   // ✅ destination, not location
      description: [''],
      price: [0, [Validators.min(0)]],
      date: ['']
    });
  }

  onSubmit() {
    if (this.tripForm.invalid) return;

    this.api.createTrip(this.tripForm.value).subscribe({
      next: (resp) => {
        this.message = 'Trip added successfully!';
        this.tripForm.reset();
      },
      error: (err) => {
        this.message = 'Error adding trip';
        console.error(err);
      }
    });
  }
}

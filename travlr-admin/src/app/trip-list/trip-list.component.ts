import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith, switchMap } from 'rxjs';
import { Trip, TripDataService } from '../trip-data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trip-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './trip-list.component.html',
  styleUrls: ['./trip-list.component.css']
})
export class TripListComponent implements OnInit {
  trips: Trip[] = [];
  total = 0;

  // server-side params
  limit = 20;
  skip = 0;
  sort = 'createdAt:desc';
  dest = '';

  search = new FormControl('');
  loading = false;

  // Add / Edit state
  adding = false;
  addForm!: FormGroup;

  editingId: string | null = null;
  editForm!: FormGroup;

  Math = Math;

  constructor(
    private api: TripDataService,
    private fb: FormBuilder,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      destination: ['', Validators.required],
      description: [''],
      price: [0, [Validators.min(0)]],
      date: ['']
    });

    this.editForm = this.fb.group({
      name: ['', Validators.required],
      destination: ['', Validators.required],
      description: [''],
      price: [0, [Validators.min(0)]],
      date: ['']
    });

    this.search.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        this.loading = true;
        this.skip = 0;
        return this.api.getTrips({
          limit: this.limit,
          skip: this.skip,
          sort: this.sort,
          dest: this.dest || undefined,
          q: (q || '').trim() || undefined
        });
      })
    ).subscribe({
      next: (resp) => {
        this.loading = false;
        this.total = resp.total;
        this.trips = resp.data;
      },
      error: () => { this.loading = false; }
    });
  }

  // paging/sort/filter
  nextPage() {
    if (this.skip + this.limit < this.total) {
      this.skip += this.limit;
      this.reload();
    }
  }
  prevPage() {
    if (this.skip >= this.limit) {
      this.skip -= this.limit;
      this.reload();
    }
  }
  setSort(value: string) {
    this.sort = value;
    this.skip = 0;
    this.reload();
  }
  setDest(value: string) {
    this.dest = value;
    this.skip = 0;
    this.reload();
  }
  reload() {
    this.loading = true;
    this.api.getTrips({
      limit: this.limit,
      skip: this.skip,
      sort: this.sort,
      dest: this.dest || undefined,
      q: (this.search.value || '').trim() || undefined
    }).subscribe({
      next: (resp) => {
        this.loading = false;
        this.total = resp.total;
        this.trips = resp.data;
      },
      error: () => { this.loading = false; }
    });
  }

  // ---------- Add ----------
  toggleAdd() {
    this.adding = !this.adding;
    this.addForm.reset({ name: '', destination: '', description: '', price: 0, date: '' });
  }
  saveAdd() {
    if (this.addForm.invalid) return;
    this.api.createTrip(this.addForm.value).subscribe({
      next: () => { this.adding = false; this.reload(); },
      error: (err) => { alert('Failed to add trip. Are you logged in?'); console.error(err); }
    });
  }

  // ---------- Edit ----------
  startEdit(t: Trip) {
    this.editingId = t._id;
    this.editForm.setValue({
      name: t.name || '',
      destination: t.destination || '',
      description: t.description || '',
      price: t.price ?? 0,
      date: (t.date ? String(t.date).substring(0, 10) : '')
    });
  }
  cancelEdit() { this.editingId = null; }
  saveEdit(t: Trip) {
    if (!this.editingId || this.editForm.invalid) return;
    this.api.updateTrip(this.editingId, this.editForm.value).subscribe({
      next: () => { this.editingId = null; this.reload(); },
      error: (err) => { alert('Failed to update trip. Are you logged in?'); console.error(err); }
    });
  }

  // ---------- Delete ----------
  deleteTrip(t: Trip) {
    if (!confirm(`Delete "${t.name}"?`)) return;
    this.api.deleteTrip(t._id).subscribe({
      next: () => this.reload(),
      error: (err) => { alert('Failed to delete trip. Are you logged in?'); console.error(err); }
    });
  }

  // ---------- Logout (moved here) ----------
  logout() {
    this.api.logout();
    this.router.navigate(['/login']);
  }
}


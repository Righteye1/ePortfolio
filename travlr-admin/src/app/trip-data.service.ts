// travlr-admin/src/app/trip-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Trip {
  _id?: string;
  title: string;
  price: number;
  description: string;
  location: string;
  date?: string;
}

@Injectable({ providedIn: 'root' })
export class TripDataService {
  private apiUrl = 'http://localhost:3000/api/trips';

  constructor(private http: HttpClient) { }

  /** Use the JWT saved by LoginComponent as 'jwt' (fallback to 'token' if present) */
  private auth(): { headers: HttpHeaders } | {} {
    const token =
      localStorage.getItem('jwt') ||   // your login stores here
      localStorage.getItem('token') || '';
    return token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
  }

  /** READ (public) */
  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.apiUrl);
  }

  /** CREATE (requires JWT) */
  addTrip(trip: Trip): Observable<Trip> {
    return this.http.post<Trip>(this.apiUrl, trip, this.auth());
  }

  /** UPDATE (requires JWT) */
  updateTrip(id: string, trip: Trip): Observable<Trip> {
    return this.http.put<Trip>(`${this.apiUrl}/${id}`, trip, this.auth());
  }

  /** DELETE (requires JWT) */
  deleteTrip(id: string): Observable<{ message: string; _id: string }> {
    return this.http.delete<{ message: string; _id: string }>(
      `${this.apiUrl}/${id}`,
      this.auth()
    );
  }
}



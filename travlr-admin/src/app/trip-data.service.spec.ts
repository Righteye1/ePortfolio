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

  private auth() {
    const token =
      localStorage.getItem('jwt') || // your login stores 'jwt'
      localStorage.getItem('token') || '';
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  getTrips(): Observable<Trip[]> { return this.http.get<Trip[]>(this.apiUrl); }
  addTrip(trip: Trip): Observable<Trip> { return this.http.post<Trip>(this.apiUrl, trip, this.auth()); }
  updateTrip(id: string, trip: Trip): Observable<Trip> { return this.http.put<Trip>(`${this.apiUrl}/${id}`, trip, this.auth()); }
  deleteTrip(id: string): Observable<{ message: string; _id: string }> {
    return this.http.delete<{ message: string; _id: string }>(`${this.apiUrl}/${id}`, this.auth());
  }
}

// travlr-admin/src/app/trip-data.service.ts
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpHeaders,
  HttpResponse,
} from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Trip {
  _id: string;
  id?: string;
  name: string;
  destination?: string;
  description?: string;
  price?: number;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TripListResponse {
  ok: true;
  data: Trip[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class TripDataService {
  private apiBase = 'http://localhost:3000';
  private tripsUrl = `${this.apiBase}/api/trips`;
  private loginUrl = `${this.apiBase}/api/login`;

  constructor(private http: HttpClient) { }

  // Auth helpers SPA
  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  login(username: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(this.loginUrl, { username, password }).pipe(
      map((resp) => {
        localStorage.setItem('auth_token', resp.token);
        return resp;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
  }

  // ETag cache
  private etags = new Map<string, string>();               // ETag
  private cache = new Map<string, TripListResponse>();     // payload

  private keyFor(opts: {
    limit?: number; skip?: number; sort?: string; dest?: string; q?: string;
  }): string {
    const parts = [
      `limit=${opts.limit ?? ''}`,
      `skip=${opts.skip ?? ''}`,
      `sort=${opts.sort ?? ''}`,
      `dest=${opts.dest ?? ''}`,
      `q=${opts.q ?? ''}`,
    ];
    return parts.join('&');
  }

  private clearAllListCaches(): void {
    this.etags.clear();
    this.cache.clear();
  }

  // List with If-None-Match
  getTrips(opts: {
    limit?: number; skip?: number; sort?: string; dest?: string; q?: string;
  } = {}): Observable<TripListResponse> {
    let params = new HttpParams();
    if (opts.limit != null) params = params.set('limit', String(opts.limit));
    if (opts.skip != null) params = params.set('skip', String(opts.skip));
    if (opts.sort) params = params.set('sort', opts.sort);
    if (opts.dest) params = params.set('dest', opts.dest);
    if (opts.q) params = params.set('q', opts.q);

    const key = this.keyFor(opts);

    let headers = this.authHeaders();
    const etag = this.etags.get(key);
    if (etag) headers = headers.set('If-None-Match', etag);

    return this.http.get<TripListResponse>(this.tripsUrl, {
      params, headers, observe: 'response'
    }).pipe(
      map((resp: HttpResponse<TripListResponse>) => {
        if (resp.status === 304) {
          const cached = this.cache.get(key);
          return cached ?? { ok: true, data: [], total: 0 };
        }
        const serverEtag = resp.headers.get('ETag') || resp.headers.get('Etag') || undefined;
        const body = resp.body || { ok: true, data: [], total: 0 };
        if (serverEtag) this.etags.set(key, serverEtag);
        this.cache.set(key, body);
        return body;
      })
    );
  }

  // Mutations invalidate cache
  createTrip(payload: Partial<Trip>): Observable<any> {
    return this.http.post(this.tripsUrl, payload, { headers: this.authHeaders() })
      .pipe(map(res => { this.clearAllListCaches(); return res; }));
  }

  updateTrip(id: string, payload: Partial<Trip>): Observable<any> {
    return this.http.put(`${this.tripsUrl}/${id}`, payload, { headers: this.authHeaders() })
      .pipe(map(res => { this.clearAllListCaches(); return res; }));
  }

  deleteTrip(id: string): Observable<any> {
    return this.http.delete(`${this.tripsUrl}/${id}`, { headers: this.authHeaders() })
      .pipe(map(res => { this.clearAllListCaches(); return res; }));
  }
}

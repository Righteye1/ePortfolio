import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { TripListComponent } from './trip-list/trip-list.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },  // ← show Login first
  { path: 'login', component: LoginComponent },          // public
  { path: 'trips', component: TripListComponent, canActivate: [authGuard] }, // protected
  { path: '**', redirectTo: 'login' }
];

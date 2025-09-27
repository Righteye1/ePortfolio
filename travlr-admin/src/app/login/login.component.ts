import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TripDataService } from '../trip-data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  message = '';

  constructor(
    private fb: FormBuilder,
    private api: TripDataService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    const { username, password } = this.loginForm.value;

    this.api.login(username, password).subscribe({
      next: () => {
        this.message = 'Login successful!';
        // go to Trips page after successful login
        this.router.navigate(['/trips']);
      },
      error: () => {
        this.message = 'Invalid credentials';
      }
    });
  }

  logout() {
    this.api.logout();
    this.message = 'Logged out';
  }
}


import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(private http: HttpClient, private router: Router) { }

  login() {
    this.http.post<{ token: string }>('http://localhost:3000/api/login', {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res) => {
        localStorage.setItem('jwt', res.token);  // ← critical
        this.error = '';
        this.router.navigate(['/trips']);
      },
      error: () => this.error = 'Invalid credentials'
    });
  }
}

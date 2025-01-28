import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-register',
  template: `
    <div class="auth-page">
      <div class="auth-left">
        <div class="auth-brand">
          <img src="assets/logo.png" alt="Logo" class="brand-logo">
          <h1>ChatApp</h1>
        </div>
        <div class="auth-features">
          <h2>Start Chatting Today</h2>
          <div class="feature-item">
            <mat-icon>chat</mat-icon>
            <span>Instant Messaging</span>
          </div>
          <div class="feature-item">
            <mat-icon>photo_library</mat-icon>
            <span>Share Media</span>
          </div>
          <div class="feature-item">
            <mat-icon>notifications</mat-icon>
            <span>Smart Notifications</span>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-box">
          <div class="auth-header">
            <h2>Create Account</h2>
            <p>Join our growing community</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
            <mat-form-field appearance="outline" class="custom-field">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username">
              <mat-icon matPrefix>person_outline</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="custom-field">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email">
              <mat-icon matPrefix>email</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="custom-field">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password">
              <mat-icon matPrefix>lock_outline</mat-icon>
              <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
            </mat-form-field>

            <mat-checkbox color="primary" class="terms-check">
              I agree to the Terms and Privacy Policy
            </mat-checkbox>

            <button mat-flat-button color="primary" type="submit" class="submit-btn" [disabled]="registerForm.invalid">
              <span *ngIf="!isLoading">Create Account</span>
              <mat-spinner diameter="24" *ngIf="isLoading"></mat-spinner>
            </button>
          </form>

          <div class="auth-footer">
            <p>Already have an account? <a (click)="goToLogin()">Sign in</a></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
   .terms-check {
    margin: 0.5rem 0;
  }
    .auth-page {
      display: flex;
      min-height: 100vh;
      background: #f5f7fa;
    }

    .auth-left {
      flex: 1;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: white;
    }

    .auth-brand {
      text-align: center;
      padding: 2rem;
    }

    .brand-logo {
      width: 80px;
      height: 80px;
      margin-bottom: 1rem;
    }

    .auth-features {
      padding: 2rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 1.5rem 0;
      font-size: 1.1rem;
    }

    .auth-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .auth-box {
      width: 100%;
      max-width: 420px;
      padding: 2.5rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-header h2 {
      font-size: 2rem;
      color: #2d3748;
      margin-bottom: 0.5rem;
    }

    .auth-header p {
      color: #718096;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .custom-field {
      width: 100%;
    }

    ::ng-deep .custom-field .mat-form-field-wrapper {
      margin: 0;
      padding: 0;
    }

    ::ng-deep .mat-form-field-prefix {
      margin-right: 0.75rem;
      color: #718096;
    }

    .form-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .forgot-link {
      color: #4c51bf;
      text-decoration: none;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .submit-btn {
      height: 48px;
      font-size: 1rem;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    .auth-footer {
      text-align: center;
      margin-top: 2rem;
      color: #718096;
    }

    .auth-footer a {
      color: #4c51bf;
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .auth-page {
        flex-direction: column;
      }

      .auth-left {
        display: none;
      }

      .auth-box {
        box-shadow: none;
        padding: 2rem 1rem;
      }
    }
  `],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule
],
  standalone: true
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.snackBar.open('Registration successful! Please login.', 'Close', {
            duration: 5000
          });
          this.router.navigate(['/login']);
        },
        error: (error) => {
          const message = error?.error?.error || 'Registration failed';
          this.snackBar.open(message, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
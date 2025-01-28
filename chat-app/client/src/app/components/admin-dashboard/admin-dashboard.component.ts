
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';
import { UsersListComponent } from '../users-list/users-list.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule, 
    MatListModule,
    MatIconModule,
    UsersListComponent
  ],
  template: `
    <app-users-list></app-users-list>
  `
})
export class AdminDashboardComponent {
  constructor(private dialogRef: MatDialogRef<AdminDashboardComponent>) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
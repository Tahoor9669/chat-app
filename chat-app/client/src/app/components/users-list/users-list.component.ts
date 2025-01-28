// users-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule],
  template: `
    <div class="users-container">
      <h2>Registered Users</h2>
      <table mat-table [dataSource]="users" class="mat-elevation-z8">
        <ng-container matColumnDef="username">
          <th mat-header-cell *matHeaderCellDef>Username</th>
          <td mat-cell *matCellDef="let user">{{user.username}}</td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let user">{{user.email}}</td>
        </ng-container>

        <ng-container matColumnDef="roles">
          <th mat-header-cell *matHeaderCellDef>Roles</th>
          <td mat-cell *matCellDef="let user">{{user.roles.join(', ')}}</td>
        </ng-container>

        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>Registered On</th>
          <td mat-cell *matCellDef="let user">{{user.createdAt | date}}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 20px;
    }
    table {
      width: 100%;
    }
    th.mat-header-cell {
      font-weight: bold;
    }
  `]
})
export class UsersListComponent implements OnInit {
  users: any[] = [];
  displayedColumns: string[] = ['username', 'email', 'roles', 'createdAt'];

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }
}
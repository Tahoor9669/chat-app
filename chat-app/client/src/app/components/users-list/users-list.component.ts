
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatCardModule],
  template: `
    <div class="dashboard-container">
      <div class="header">
        <div class="title-section">
          <h1>Admin Dashboard</h1>
          <p class="subtitle">Manage System Users</p>
        </div>
        <div class="stats">
          <div class="stat-card">
            <span class="stat-value">{{users.length}}</span>
            <span class="stat-label">Total Users</span>
          </div>
        </div>
      </div>

      <div class="table-container">
        <table mat-table [dataSource]="users" class="users-table">
          <!-- Username Column -->
          <ng-container matColumnDef="username">
            <th mat-header-cell *matHeaderCellDef>Username</th>
            <td mat-cell *matCellDef="let user">
              <div class="user-info">
                <div class="user-avatar" [style.backgroundColor]="getAvatarColor(user.username)">
                  {{user.username[0].toUpperCase()}}
                </div>
                <span>{{user.username}}</span>
              </div>
            </td>
          </ng-container>

          <!-- Email Column -->
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let user">
              <div class="email-cell">
                <mat-icon class="email-icon">email</mat-icon>
                {{user.email}}
              </div>
            </td>
          </ng-container>

          <!-- Roles Column -->
          <ng-container matColumnDef="roles">
  <th mat-header-cell *matHeaderCellDef>Roles</th>
  <td mat-cell *matCellDef="let user">
    <div class="roles-container">
      <!-- Check for super_admin role -->
      <span *ngIf="user.roles.includes('super_admin')" 
            class="role-badge super-role">
        Super Admin
      </span>
      <!-- Check for group admin role -->
      <span *ngIf="isGroupAdmin(user)" 
            class="role-badge admin-role">
        Group Admin
      </span>
      <!-- Show regular user role only if no other roles -->
      <span *ngIf="!isGroupAdmin(user) && !user.roles.includes('super_admin')" 
            class="role-badge">
        User
      </span>
    </div>
  </td>
</ng-container>

          <!-- Registration Date Column -->
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Registered On</th>
            <td mat-cell *matCellDef="let user">
              <div class="date-cell">
                <mat-icon>calendar_today</mat-icon>
                {{user.createdAt | date:'mediumDate'}}
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 32px;
      background: #f8fafc;
      min-height: 100vh;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .title-section h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      color: #1e293b;
    }

    .subtitle {
      margin: 8px 0 0;
      color: #64748b;
      font-size: 16px;
    }

    .stats {
      display: flex;
      gap: 16px;
    }

    .stat-card {
      background: #4f46e5;
      padding: 16px 32px;
      border-radius: 16px;
      text-align: center;
      color: white;
    }

    .stat-value {
      display: block;
      font-size: 28px;
      font-weight: 700;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }

    .table-container {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
    }

    th.mat-header-cell {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      font-size: 14px;
      padding: 16px;
      border-bottom: 2px solid #e2e8f0;
    }

    td.mat-cell {
      padding: 16px;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 16px;
    }

    .email-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .email-cell mat-icon {
      color: #64748b;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .roles-container {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .role-badge {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      background: #f1f5f9;
      color: #475569;
    }

    .role-badge.admin-role {
      background: #e0e7ff;
      color: #4f46e5;
    }

    .role-badge.super-role {
      background: #4f46e5;
      color: white;
    }

    .date-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #64748b;
    }

    .date-cell mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
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

  getAvatarColor(username: string): string {
    const colors = [
      '#4f46e5', '#7c3aed', '#db2777', '#ea580c',
      '#059669', '#0284c7', '#7c2d12', '#334155'
    ];
    const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  }
  isGroupAdmin(user: any): boolean {
    return user.roles.includes('group_admin') || 
           (user.groups && user.groups.some((group: any) => group.admins?.includes(user._id)));
  }
}
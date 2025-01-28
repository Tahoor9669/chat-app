// manage-members-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-manage-members-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-container">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-content">
          <div class="header-left">
            <mat-icon class="group-icon">people</mat-icon>
            <div class="header-titles">
              <h2 class="main-title">Manage Members</h2>
              <p class="sub-title">{{ data.group.name }}</p>
            </div>
          </div>
          <div class="member-count">
            <span class="count">{{ filteredMembers.length }}</span>
            <span class="label">Members</span>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="search-container">
        <div class="search-box">
          <mat-icon class="search-icon">search</mat-icon>
          <input 
            type="text" 
            placeholder="Search members..."
            (input)="filterMembers($event)"
            class="search-input"
          >
        </div>
      </div>

      <!-- Members List -->
      <div class="members-list">
        <div *ngFor="let member of filteredMembers" 
             class="member-card"
             [class.admin-card]="isGroupAdmin(member)">
          <!-- Member Info -->
          <div class="member-info">
            <div class="member-avatar" [style.background-color]="getRandomColor(member.username)">
              {{ member.username[0].toUpperCase() }}
            </div>
            <div class="member-details">
              <span class="member-name">{{ member.username }}</span>
              <div class="member-roles">
                <span class="role-badge" *ngIf="isGroupAdmin(member)">
                  <mat-icon>admin_panel_settings</mat-icon>
                  Group Admin
                </span>
                <span class="role-badge super-admin" *ngIf="isSuperAdmin(member)">
                  <mat-icon>verified_user</mat-icon>
                  Super Admin
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="member-actions">
            <button 
              *ngIf="!isGroupAdmin(member) && !isSuperAdmin(member)"
              class="action-button promote-button"
              (click)="promoteToGroupAdmin(member._id)">
              <mat-icon>arrow_upward</mat-icon>
              Make Admin
            </button>
            <button 
              *ngIf="!isSuperAdmin(member)"
              class="action-button super-button"
              (click)="promoteToSuperAdmin(member._id)">
              <mat-icon>security</mat-icon>
              Make Super Admin
            </button>
            <button 
              *ngIf="isCurrentUserSuperAdmin() && !isSuperAdmin(member)"
              class="action-button remove-button"
              (click)="removeUser(member)">
              <mat-icon>person_remove</mat-icon>
              Remove
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <button mat-button class="close-button" (click)="dialogRef.close()">
          Close
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      height: 80vh;
      min-width: 700px;
      background: #f8fafc;
    }

    .dialog-header {
      background: white;
      padding: 24px;
      border-bottom: 1px solid #e2e8f0;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .group-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #6366f1;
    }

    .header-titles {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .main-title {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #1e293b;
    }

    .sub-title {
      margin: 0;
      color: #64748b;
      font-size: 14px;
    }

    .member-count {
      background: #eef2ff;
      padding: 8px 16px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .count {
      font-size: 20px;
      font-weight: 600;
      color: #6366f1;
    }

    .label {
      font-size: 12px;
      color: #6366f1;
    }

    .search-container {
      padding: 16px 24px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f1f5f9;
      padding: 12px 16px;
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .search-box:focus-within {
      background: white;
      box-shadow: 0 0 0 2px #6366f1;
    }

    .search-icon {
      color: #64748b;
    }

    .search-input {
      border: none;
      background: transparent;
      width: 100%;
      font-size: 14px;
      color: #1e293b;
      outline: none;
    }

    .search-input::placeholder {
      color: #94a3b8;
    }

    .members-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px 24px;
    }

    .member-card {
      background: white;
      border-radius: 50px;
      width: 100%;
      padding: 16px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
    }

    .member-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .admin-card {
      background: #fafaff;
      border-color: #e0e7ff;
    }

    .member-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .member-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 18px;
    }

    .member-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .member-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 16px;
    }

    .member-roles {
      display: flex;
      gap: 8px;
    }

    .role-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      background: #eef2ff;
      color: #6366f1;
    }

    .role-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .role-badge.super-admin {
      background: #818cf8;
      color: white;
    }

    .member-actions {
      display: flex;
      gap: 8px;
    }

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      color: white;
    }

    .action-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .promote-button {
      background: #6366f1;
    }

    .promote-button:hover {
      background: #4f46e5;
    }

    .super-button {
      background: #818cf8;
    }

    .super-button:hover {
      background: #6366f1;
    }

    .remove-button {
      background: #ef4444;
    }

    .remove-button:hover {
      background: #dc2626;
    }

    .dialog-footer {
      padding: 16px 24px;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
    }

    .close-button {
      color: #64748b;
    }

    /* Scrollbar Styling */
    .members-list::-webkit-scrollbar {
      width: 8px;
    }

    .members-list::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
    }

    .members-list::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .members-list::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class ManageMembersDialogComponent {
  filteredMembers: any[] = [];
  groups: any[] = []; 

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { group: any },
    public dialogRef: MatDialogRef<ManageMembersDialogComponent>,
    private groupService: GroupService,
    private snackBar: MatSnackBar
  ) {
    this.filteredMembers = [...this.data.group.members];
  }

  filterMembers(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredMembers = this.data.group.members.filter((member: any) =>
      member.username.toLowerCase().includes(searchTerm)
    );
  }

  isGroupAdmin(member: any): boolean {
    return this.data.group.admins.some((admin: any) => admin._id === member._id);
  }

  isSuperAdmin(member: any): boolean {
    return member.roles?.includes('super_admin');
  }

  isCurrentUserSuperAdmin(): boolean {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return currentUser?.user?.roles?.includes('super_admin') || false;
  }

  getRandomColor(username: string): string {
    const colors = [
      '#6366f1', '#8b5cf6', '#d946ef', '#ec4899',
      '#f43f5e', '#f59e0b', '#84cc16', '#10b981'
    ];
    const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  }

  promoteToGroupAdmin(userId: string): void {
    this.groupService.promoteToGroupAdmin(this.data.group._id, userId).subscribe({
      next: () => {
        this.snackBar.open('Successfully promoted to group admin', 'Close', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.snackBar.open(error.message || 'Error promoting user', 'Close', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  promoteToSuperAdmin(userId: string): void {
    this.groupService.promoteToSuperAdmin(userId).subscribe({
      next: () => {
        this.snackBar.open('Successfully promoted to super admin', 'Close', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.snackBar.open(error.message || 'Error promoting user', 'Close', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  removeUser(member: any): void {
    if (confirm(`Are you sure you want to remove ${member.username} from the group?`)) {
      this.groupService.removeUserFromGroup(this.data.group._id, member._id).subscribe({
        next: (response) => {
          this.snackBar.open(`Successfully removed ${member.username} from the group`, 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          // Remove user from filtered members list
          this.filteredMembers = this.filteredMembers.filter(m => m._id !== member._id);
          // Update the group's member count
          if (this.data.group.members) {
            this.data.group.members = this.data.group.members.filter((m: any) => m._id !== member._id);
          }
          // Close dialog and return the removed user's ID
          this.dialogRef.close({ refresh: true, removedUserId: member._id });
        },
        error: (error) => {
          this.snackBar.open(error.message || 'Error removing user', 'Close', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
}


}
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
    <div class="dialog-wrapper">
      <!-- Header Section -->
      <div class="header">
        <div class="header-main">
          <div class="title-area">
            <h2>{{ data.group.name }}</h2>
            <p>Manage Group Members</p>
          </div>
          <div class="member-stats">
            <span>{{ filteredMembers.length }}</span>
            Members
          </div>
        </div>
        <div class="search-area">
          <mat-icon>search</mat-icon>
          <input 
            type="text" 
            placeholder="Search members..."
            (input)="filterMembers($event)"
          >
        </div>
      </div>

      <!-- Members List -->
      <div class="members-container">
        <div *ngFor="let member of filteredMembers" 
             class="member-item"
             [class.is-admin]="isGroupAdmin(member)">
          <!-- Member Details -->
          <div class="member-left">
            <div class="avatar" [style.background-color]="getRandomColor(member.username)">
              {{ member.username[0].toUpperCase() }}
            </div>
            <div class="member-info">
              <span class="name">{{ member.username }}</span>
              <div class="badges">
                <span class="badge admin" *ngIf="isGroupAdmin(member)">
                  <mat-icon>shield</mat-icon>
                  Admin
                </span>
                <span class="badge super" *ngIf="isSuperAdmin(member)">
                  <mat-icon>star</mat-icon>
                  Super Admin
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="member-actions">
            <button 
              *ngIf="!isGroupAdmin(member) && !isSuperAdmin(member)"
              class="action-btn promote"
              (click)="promoteToGroupAdmin(member._id)">
              <mat-icon>arrow_upward</mat-icon>
              Admin
            </button>
            <button 
              *ngIf="!isSuperAdmin(member)"
              class="action-btn super"
              (click)="promoteToSuperAdmin(member._id)">
              <mat-icon>star</mat-icon>
              Super
            </button>
            <button 
              *ngIf="isCurrentUserSuperAdmin() && !isSuperAdmin(member)"
              class="action-btn remove"
              (click)="removeUser(member)">
              <mat-icon>remove_circle</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <button class="close-btn" (click)="dialogRef.close()">Done</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-wrapper {
      width: 800px;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
      position: relative;
    }

    .header {
      padding: 32px;
      background: #fafafa;
      border-radius: 20px 20px 0 0;
    }

    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .title-area h2 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      line-height: 1.2;
    }

    .title-area p {
      margin: 8px 0 0;
      color: #6b7280;
      font-size: 16px;
    }

    .member-stats {
      background: #4f46e5;
      color: white;
      padding: 12px 24px;
      border-radius: 16px;
      text-align: center;
      font-size: 15px;
      font-weight: 500;
    }

    .member-stats span {
      display: block;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .search-area {
      display: flex;
      align-items: center;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px 16px;
      transition: all 0.2s;
    }

    .search-area:focus-within {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    .search-area mat-icon {
      color: #9ca3af;
      margin-right: 12px;
    }

    .search-area input {
      border: none;
      outline: none;
      width: 100%;
      font-size: 16px;
      color: #111827;
    }

    .search-area input::placeholder {
      color: #9ca3af;
    }

    .members-container {
      padding: 24px 32px;
    }

    .member-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f9fafb;
      border-radius: 16px;
      margin-bottom: 12px;
      transition: all 0.2s;
    }

    .member-item:hover {
      background: #f3f4f6;
      transform: translateY(-1px);
    }

    .member-item.is-admin {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
    }

    .member-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 20px;
    }

    .member-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .name {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    .badges {
      display: flex;
      gap: 8px;
    }

    .badge {
      display: flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
    }

    .badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .badge.admin {
      background: #eff6ff;
      color: #3b82f6;
    }

    .badge.super {
      background: #4f46e5;
      color: white;
    }

    .member-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn mat-icon {
      font-size: 18px;
      margin-right: 4px;
    }

    .action-btn.promote {
      background: #4f46e5;
      color: white;
    }

    .action-btn.promote:hover {
      background: #4338ca;
    }

    .action-btn.super {
      background: #6366f1;
      color: white;
    }

    .action-btn.super:hover {
      background: #4f46e5;
    }

    .action-btn.remove {
      background: #ef4444;
      color: white;
      padding: 8px;
    }

    .action-btn.remove:hover {
      background: #dc2626;
    }

    .footer {
      padding: 24px 32px;
      background: #fafafa;
      border-top: 1px solid #e5e7eb;
      border-radius: 0 0 20px 20px;
      display: flex;
      justify-content: flex-end;
    }

    .close-btn {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #4338ca;
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
      '#4f46e5', '#7c3aed', '#db2777', '#ea580c',
      '#059669', '#0284c7', '#7c2d12', '#334155'
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
        next: () => {
          this.snackBar.open(`Successfully removed ${member.username} from the group`, 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.filteredMembers = this.filteredMembers.filter(m => m._id !== member._id);
          if (this.data.group.members) {
            this.data.group.members = this.data.group.members.filter((m: any) => m._id !== member._id);
          }
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
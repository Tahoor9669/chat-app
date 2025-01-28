import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GroupService } from '../../services/group.service';

@Component({
    selector: 'app-join-requests-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatListModule,
        MatSnackBarModule
    ],
    template: `
        <div class="dialog-container">
            <h2 mat-dialog-title>Pending Join Requests</h2>
            <mat-dialog-content>
                <mat-list>
                    <mat-list-item *ngFor="let request of joinRequests" class="request-item">
                        <div class="request-content">
                            <span class="username">{{request.userId.username}}</span>
                            <div class="action-buttons">
                                <button mat-button color="primary" 
                                        (click)="handleRequest(request.userId._id, 'approve')">
                                    Approve
                                </button>
                                <button mat-button color="warn" 
                                        (click)="handleRequest(request.userId._id, 'reject')">
                                    Reject
                                </button>
                            </div>
                        </div>
                    </mat-list-item>
                    <mat-list-item *ngIf="joinRequests.length === 0" class="no-requests">
                        No pending join requests
                    </mat-list-item>
                </mat-list>
            </mat-dialog-content>
            <mat-dialog-actions align="end">
                <button mat-button mat-dialog-close>Close</button>
            </mat-dialog-actions>
        </div>
    `,
    styles: [`
        .dialog-container {
            padding: 20px;
            min-width: 400px;
        }

        .request-item {
            margin-bottom: 8px;
            padding: 8px 0;
        }

        .request-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }

        .username {
            font-weight: 500;
            color: #333;
        }

        .action-buttons {
            display: flex;
            gap: 8px;
        }

        .no-requests {
            color: #666;
            font-style: italic;
            text-align: center;
            padding: 16px 0;
        }

        mat-dialog-content {
            max-height: 400px;
            overflow-y: auto;
        }

        mat-dialog-actions {
            margin-top: 16px;
            padding-top: 8px;
            border-top: 1px solid #eee;
        }
    `]
})
export class JoinRequestsDialogComponent implements OnInit {
    joinRequests: any[] = [];
    isLoading: boolean = false;  // Add this line

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { groupId: string },
        private groupService: GroupService,
        private snackBar: MatSnackBar,
        private dialogRef: MatDialogRef<JoinRequestsDialogComponent>
    ) {}

    ngOnInit() {
        this.loadJoinRequests();
    }

    loadJoinRequests() {
      console.log('Loading join requests for group:', this.data.groupId);
      this.groupService.getPendingJoinRequests(this.data.groupId).subscribe({
          next: (requests) => {
              console.log('Received join requests:', requests);
              this.joinRequests = requests;
          },
          error: (error) => {
              console.error('Error loading requests:', error);
              this.snackBar.open('Error loading requests: ' + error.message, 'Close', {
                  duration: 3000
              });
          }
      });
  }

  handleRequest(userId: string, action: 'approve' | 'reject') {
    console.log('Request data:', {groupId: this.data.groupId, userId, action});
    this.isLoading = true;
    
    this.groupService.handleJoinRequest(this.data.groupId, userId, action).subscribe({
        next: (response) => {
            console.log('Join request response:', response);
            this.snackBar.open(`Request ${action}ed successfully`, 'Close', {
                duration: 3000
            });
            
            // Force refresh groups
            this.groupService.getGroups().subscribe(() => {
                this.loadJoinRequests();
                this.dialogRef.close({
                    refresh: true,
                    groupId: this.data.groupId,
                    action: action,
                    userId: userId
                });
            });
        },
        error: (error) => {
            console.error('Error handling request:', error);
            this.snackBar.open(error.message || `Error ${action}ing request`, 'Close', {
                duration: 3000
            });
            this.isLoading = false;
        }
    });
}
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { GroupService } from '../../services/group.service';
import { PromotionRequest, PromotionResponse } from '../../models/promotion.models';
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
   MatProgressSpinnerModule,
   MatDialogModule,
   MatSnackBarModule,
   MatTabsModule,
   UsersListComponent
 ],
 template: `
   <mat-tab-group>
     <mat-tab label="Promotion Requests">
       <mat-card class="admin-dashboard">
         <mat-card-header>
           <mat-card-title>Admin Dashboard - Promotion Requests</mat-card-title>
         </mat-card-header>
         <mat-card-content>
           <div *ngIf="isLoading" class="loading-spinner">
             <mat-spinner diameter="40"></mat-spinner>
           </div>
           <mat-list *ngIf="!isLoading">
             <mat-list-item *ngFor="let request of promotionRequests">
               <div class="request-item">
                 <div class="request-info">
                   <span class="username">{{request.userId.username}}</span>
                   <span class="group-name">requests admin access to {{request.groupId.name}}</span>
                   <span class="date">{{request.requestDate | date:'short'}}</span>
                 </div>
                 <div class="request-actions">
                   <button mat-raised-button color="primary" (click)="handleRequest(request._id, 'approve')">
                     <mat-icon>check</mat-icon> Approve
                   </button>
                   <button mat-raised-button color="warn" (click)="handleRequest(request._id, 'reject')">
                     <mat-icon>close</mat-icon> Reject
                   </button>
                 </div>
               </div>
             </mat-list-item>
             <mat-list-item *ngIf="promotionRequests.length === 0" class="no-requests">
               No pending promotion requests
             </mat-list-item>
           </mat-list>
         </mat-card-content>
       </mat-card>
     </mat-tab>
     <mat-tab label="Users">
       <app-users-list></app-users-list>
     </mat-tab>
   </mat-tab-group>
 `,
 styles: [`
   .admin-dashboard {
     min-width: 600px;
     max-width: 800px;
     margin: 20px;
   }

   .request-item {
     display: flex;
     justify-content: space-between;
     align-items: center;
     width: 100%;
     padding: 10px 0;
   }

   .request-info {
     display: flex;
     flex-direction: column;
     gap: 4px;
   }

   .username {
     font-weight: bold;
     color: #1976d2;
   }

   .group-name {
     color: #666;
   }

   .date {
     font-size: 0.8em;
     color: #888;
   }

   .request-actions {
     display: flex;
     gap: 8px;
   }

   .loading-spinner {
     display: flex;
     justify-content: center;
     padding: 2rem;
   }

   .no-requests {
     text-align: center;
     color: #666;
     font-style: italic;
   }

   mat-list-item {
     height: auto !important;
     margin-bottom: 8px;
   }

   button mat-icon {
     margin-right: 4px;
   }

   .request-actions button {
     min-width: 100px;
   }

   mat-card-content {
     max-height: 500px;
     overflow-y: auto;
   }
 `]
})
export class AdminDashboardComponent implements OnInit {
 promotionRequests: PromotionRequest[] = [];
 isLoading = false;

 constructor(
   private groupService: GroupService,
   private dialogRef: MatDialogRef<AdminDashboardComponent>,
   private snackBar: MatSnackBar
 ) {}

 ngOnInit(): void {
   this.loadPromotionRequests();
 }

 loadPromotionRequests(): void {
   this.isLoading = true;
   this.groupService.getPendingPromotionRequests().subscribe({
     next: (requests: PromotionRequest[]) => {
       this.promotionRequests = requests;
       this.isLoading = false;
     },
     error: (error: any) => {
       console.error('Error loading promotion requests:', error);
       this.snackBar.open(
         error.message || 'Error loading requests', 
         'Close', 
         { duration: 3000 }
       );
       this.isLoading = false;
     }
   });
 }

 handleRequest(requestId: string, action: 'approve' | 'reject'): void {
   this.isLoading = true;
   this.groupService.handlePromotionRequest(requestId, action).subscribe({
     next: (response: PromotionResponse) => {
       this.snackBar.open(
         response.message || `Request ${action}ed successfully`, 
         'Close', 
         { duration: 3000 }
       );
       this.loadPromotionRequests();
     },
     error: (error: any) => {
       console.error(`Error ${action}ing request:`, error);
       this.snackBar.open(
         error.message || `Error ${action}ing request`, 
         'Close',
         { duration: 3000 }
       );
       this.isLoading = false;
     }
   });
 }

 closeDialog(): void {
   this.dialogRef.close();
 }
}
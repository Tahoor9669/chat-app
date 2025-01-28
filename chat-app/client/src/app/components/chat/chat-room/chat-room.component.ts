import { VideoChatComponent } from '../../video-chat/video-chat.component';
import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// Material imports
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { SocketService } from '../../../services/socket.service';
import { ChannelService } from '../../../services/channel.service';
import { GroupService } from '../../../services/group.service';

// Components
import { CreateGroupDialogComponent } from '../../../components/create-group-dialog/create-group-dialog.component';
import { CreateChannelDialogComponent } from '../../../components/create-channel-dialog/create-channel-dialog.component';
import { AdminDashboardComponent } from '../../../components/admin-dashboard/admin-dashboard.component';

// Interfaces
import { PromotionRequest, PromotionResponse, PromotionError } from '../../../models/promotion.models';

import { JoinRequestsDialogComponent } from '../../../components/join-requests-dialog/join-requests-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { ManageMembersDialogComponent } from '../../../components/manage-members-dialog/manage-members-dialog.component';

// Local interfaces
interface Group {
  _id: string;
  name: string;
  isMember?: boolean;
  isAdmin?: boolean;
  channels?: any[];
  createdBy?: string;
  description?: string;
  hasPendingJoinRequest?: boolean;
  joinRequestStatus?: 'pending' | 'approved' | 'rejected';
}
interface Channel {
  _id?: string;
  name: string;
  description?: string;
  messages?: any[];
}

interface Message {
  _id?: string;
  sender?: {
    _id: string;
    username: string;
  };
  content: string;
  messageType?: 'text' | 'image';
  timestamp?: Date;
  channelId?: string;
}
@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    CreateGroupDialogComponent,
    CreateChannelDialogComponent,
    AdminDashboardComponent,
    VideoChatComponent,
    JoinRequestsDialogComponent,
    ManageMembersDialogComponent
],
  
template: `
<div class="app-container">
<nav class="nav-bar">
  <div class="nav-left">
    <div class="brand">
      <mat-icon class="brand-icon">chat</mat-icon>
      <h1>ChatApp</h1>
    </div>
    <button mat-flat-button color="primary" *ngIf="isCurrentUserSuperAdmin()" (click)="viewPromotionRequests()">
      <mat-icon>admin_panel_settings</mat-icon>
      Admin Panel
    </button>
  </div>
  
  <div class="user-section">
    <div class="user-avatar" [style.background-color]="getProfileColor()">
      {{ getInitial() }}
    </div>
    <span class="username">{{ getCurrentUsername() }}</span>
    <button mat-icon-button [matMenuTriggerFor]="userMenu">
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #userMenu="matMenu">
      <button mat-menu-item (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span>Logout</span>
      </button>
    </mat-menu>
  </div>
</nav>

  <div class="content-wrapper">
    <!-- Modernized sidebar -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>Groups</h2>
        <button mat-fab extended color="primary" (click)="createGroup()">
          <mat-icon>add</mat-icon>
          New Group
        </button>
      </div>

      <div class="groups-list">
        <div *ngFor="let group of groups" 
             class="group-card" 
             [class.active]="selectedGroup?._id === group._id"
             (click)="selectGroup(group)">
          <div class="group-info">
            <div class="group-avatar">{{group.name[0]}}</div>
            <div class="group-details">
              <span class="group-name">{{group.name}}</span>
              <span class="group-status" *ngIf="group.joinRequestStatus === 'pending'">Pending</span>
            </div>
          </div>
          
          <div class="group-actions">
            <ng-container *ngIf="!isCurrentUserSuperAdmin() && !group.isAdmin">
              <ng-container [ngSwitch]="group.joinRequestStatus">
                <button 
                  mat-stroked-button
                  *ngSwitchDefault
                  class="join-btn"
                  (click)="joinGroup(group, $event)"
                  [disabled]="group.isMember">
                  Join
                </button>
                <span *ngSwitchCase="'pending'" class="status pending">Pending</span>
                <span *ngSwitchCase="'approved'" class="status approved">Member</span>
                <span *ngSwitchCase="'rejected'" class="status rejected">Rejected</span>
              </ng-container>
            </ng-container>

            <div class="admin-actions" *ngIf="group.isAdmin || isCurrentUserSuperAdmin()">
  <button mat-icon-button (click)="viewJoinRequests(group, $event)">
    <mat-icon>people</mat-icon>
  </button>
  <button mat-icon-button (click)="viewManageMembers(group, $event)" *ngIf="isCurrentUserSuperAdmin()">
    <mat-icon>manage_accounts</mat-icon>
  </button>
  <button mat-icon-button color="warn" (click)="deleteGroup(group, $event)">
    <mat-icon>delete</mat-icon>
  </button>
</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modernized main content -->
    <div class="main-content" *ngIf="selectedGroup">
      <div class="chat-header">
        <div class="channel-info">
          <h2>{{selectedChannel?.name || 'Select a Channel'}}</h2>
          <span class="channel-description">{{selectedChannel?.description}}</span>
        </div>
       
      </div>

      <div class="channels-wrapper" *ngIf="selectedGroup?.isMember || isCurrentUserSuperAdmin()">
        <div class="channels-header">
          <h3>Channels</h3>
          <button mat-mini-fab 
                  *ngIf="selectedGroup?.isAdmin || isCurrentUserSuperAdmin()"
                  (click)="createChannel()">
            <mat-icon>add</mat-icon>
          </button>
        </div>

        <div class="channels-list">
          <div *ngFor="let channel of selectedGroup?.channels" 
               class="channel-item"
               [class.active]="selectedChannel?._id === channel._id"
               (click)="selectChannel(channel)">
            <mat-icon>tag</mat-icon>
            <span>{{channel?.name}}</span>
          </div>
        </div>
      </div>

      <div class="messages-wrapper" *ngIf="selectedChannel">
        <div class="messages" #messagesContainer>
          <div *ngIf="isLoading" class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          
          <div *ngFor="let message of messages" class="message-bubble">
            <div class="message-avatar">{{message.sender?.username[0]}}</div>
            <div class="message-content">
              <div class="message-header">
                <span class="sender-name">{{message.sender?.username}}</span>
                <span class="message-time">{{message.timestamp | date:'shortTime'}}</span>
              </div>
              <div class="message-body">
                <ng-container [ngSwitch]="message.messageType">
                  <ng-container *ngSwitchCase="'image'">
                    <img [src]="message.content" 
                         alt="Shared image" 
                         class="message-image"
                         (error)="message.loadError = true">
                    <span *ngIf="message.loadError">Image failed to load</span>
                  </ng-container>
                  <span *ngSwitchDefault>{{message.content}}</span>
                </ng-container>
              </div>
            </div>
          </div>
        </div>

        <div class="message-input">
          <mat-form-field appearance="outline" class="input-field">
            <input matInput 
                   [(ngModel)]="newMessage" 
                   placeholder="Type your message..."
                   (keyup.enter)="sendMessage()">
          </mat-form-field>
          
          <div class="message-actions">
            <input #fileInput
                   type="file"
                   hidden
                   accept="image/*"
                   (change)="onFileSelected($event)">
            <button mat-icon-button 
                    color="primary" 
                    (click)="fileInput.click()"
                    matTooltip="Send image">
              <mat-icon>image</mat-icon>
            </button>
            <button mat-icon-button
                    color="primary"
                    (click)="openVideoChat()"
                    matTooltip="Video Call"
                    *ngIf="selectedChannel && selectedGroup?.isMember">
              <mat-icon>videocam</mat-icon>
            </button>
            <button mat-fab 
                    color="primary" 
                    class="send-btn"
                    (click)="sendMessage()"
                    [disabled]="!newMessage.trim()">
              <mat-icon>send</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`,

styles: [`
.app-container {
  height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

/* Modern Profile Bar */
.profile-bar {
  background: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.profile-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  font-size: 1.2rem;
}

.profile-name {
  font-weight: 500;
  font-size: 1.1rem;
  color: #2c3e50;
}

.content-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Modern Sidebar */
.sidebar {
  width: 360px;
  background: white;
  border-right: 1px solid #edf2f7;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #edf2f7;
}

.sidebar-header h2 {
  margin: 0 0 1rem 0;
  color: #2d3748;
  font-size: 1.5rem;
}

.groups-list {
  overflow-y: auto;
  padding: 1rem;
}

.group-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #edf2f7;
}

.group-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.group-card.active {
  background: #f7fafc;
  border-color: #4299e1;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.group-avatar {
  width: 48px;
  height: 48px;
  background: #4299e1;
  border-radius: 12px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
}

.group-name {
  font-weight: 500;
  color: #2d3748;
  font-size: 1.1rem;
}

.group-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Status Badges */
.status {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status.pending {
  background: #feebc8;
  color: #c05621;
}

.status.approved {
  background: #c6f6d5;
  color: #2f855a;
}

.status.rejected {
  background: #fed7d7;
  color: #c53030;
}

/* Main Content Area */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 1.5rem;
  background: white;
  border-bottom: 1px solid #edf2f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h2 {
  margin: 0;
  color: #2d3748;
}

.channels-wrapper {
  padding: 1.5rem;
  background: white;
  border-bottom: 1px solid #edf2f7;
}

.channels-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.channels-list {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.channel-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f7fafc;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.channel-item:hover {
  background: #edf2f7;
}

.channel-item.active {
  background: #4299e1;
  color: white;
}

.messages-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 1.5rem;
  gap: 1rem;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-bubble {
  display: flex;
  gap: 1rem;
  max-width: 80%;
}

.message-avatar {
  width: 40px;
  height: 40px;
  background: #4299e1;
  border-radius: 12px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.message-content {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.sender-name {
  font-weight: 500;
  color: #2d3748;
}

.message-time {
  color: #718096;
  font-size: 0.875rem;
}

.message-image {
  max-width: 300px;
  border-radius: 8px;
  margin-top: 0.5rem;
}

.message-input {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  box-shadow: 0 -2px 4px rgba(0,0,0,0.05);
}

.input-field {
  flex: 1;
}

.message-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.send-btn {
  width: 48px;
  height: 48px;
}

/* Loading State */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: fixed;
    z-index: 10;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }
}
.nav-bar {
  height: 64px;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  z-index: 100;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;

  .brand-icon {
    color: #3b82f6;
    font-size: 28px;
    width: 28px;
    height: 28px;
  }

  h1 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }
}

.user-section {
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
  font-size: 1rem;
}

.username {
  font-weight: 500;
  color: #1e293b;
}
`],

  })
  export class ChatRoomComponent implements OnInit, AfterViewChecked {
    @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
    @ViewChild('fileInput') fileInput!: ElementRef;
    
    groups: Group[] = [];
    selectedGroup: Group | null = null;
    selectedChannel: Channel | null = null;
    messages: any[] = [];
    newMessage = '';
    isLoading = false;
    pendingRequests: { [key: string]: boolean } = {};
  


    constructor(
      private socketService: SocketService,
      private channelService: ChannelService,
      private groupService: GroupService,
      private dialog: MatDialog,
      private snackBar: MatSnackBar,
      private http: HttpClient
    ) {}


  
    ngOnInit() {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      console.log('Current user at init:', currentUser);
      this.loadGroups();
      this.socketService.onNewMessage().subscribe(message => {
        if (this.selectedChannel && message.channelId === this.selectedChannel._id) {
          this.messages.push(message);
          this.scrollToBottom();
        }
      });
    }
  
    ngAfterViewChecked() {
      this.scrollToBottom();
    }
  
    private scrollToBottom(): void {
      try {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      } catch (err) {}
    }
  
    loadGroups() {
      console.log('Loading groups...');
      this.isLoading = true;
      this.groupService.getGroups().subscribe({
          next: (groups) => {
              console.log('Groups loaded successfully:', groups);
              
              this.groups = groups;
              
              // Update selected group if exists
              if (this.selectedGroup?._id) {
                  const updatedGroup = this.groups.find(g => g._id === this.selectedGroup!._id);
                  if (updatedGroup) {
                      console.log('Updating selected group:', updatedGroup);
                      this.selectedGroup = updatedGroup;
                      
                      // Log membership status
                      console.log('Group status:', {
                          isMember: updatedGroup.isMember,
                          joinRequestStatus: updatedGroup.joinRequestStatus,
                          channelsCount: updatedGroup.channels?.length || 0
                      });
                  }
              }
              this.isLoading = false;
          },
          error: (error) => {
              console.error('Error in loadGroups:', error);
              this.isLoading = false;
          }
      });
  }
   
  selectGroup(group: Group) {
    console.log('Selecting group:', group);
    console.log('Group channels:', group.channels);
    console.log('Member status:', group.isMember);
    
    this.groupService.getGroups().subscribe({
        next: (groups) => {
            const updatedGroup = groups.find(g => g._id === group._id);
            if (updatedGroup) {
                console.log('Updated group data:', updatedGroup);
                console.log('Updated channels:', updatedGroup.channels);
                
                this.groups = groups;
                this.selectedGroup = updatedGroup;
                this.selectedChannel = null;
                this.messages = [];
            }
        },
        error: (error) => {
            console.error('Error reloading group:', error);
        }
    });
}
    joinGroup(group: Group, event: MouseEvent) {
      event.stopPropagation();
      this.isLoading = true;
      console.log('Attempting to join group:', group._id);
      
      this.groupService.joinGroup(group._id).subscribe({
          next: (response) => {
              console.log('Join group response:', response);
              this.snackBar.open('Join request sent successfully', 'Close', { duration: 3000 });
              this.loadGroups();
          },
          error: (error) => {
              console.error('Error joining group:', error);
              this.snackBar.open('Error sending join request', 'Close', { duration: 3000 });
              this.isLoading = false;
          }
      });
  }
  
    leaveGroup(group: Group, event: Event) {
      event.stopPropagation();
      this.isLoading = true;
      
      this.groupService.leaveGroup(group._id).subscribe({
        next: (response) => {
          console.log('Left group:', response);
          if (this.selectedGroup?._id === group._id) {
            this.selectedGroup = null;
            this.selectedChannel = null;
            this.messages = [];
          }
          this.loadGroups();
        },
        error: (error) => {
          console.error('Error leaving group:', error);
          this.isLoading = false;
        }
      });
    }
    deleteGroup(group: Group, event: Event) {
      event.stopPropagation();
      console.log('Delete button clicked for group:', group._id);
      
      if (confirm(`Delete group "${group.name}"?`)) {
        this.groupService.deleteGroup(group._id).subscribe({
          next: () => {
            console.log('Delete API call successful');
            if (this.selectedGroup?._id === group._id) {
              this.selectedGroup = null;
              this.selectedChannel = null;
              this.messages = [];
            }
            this.loadGroups();
            this.snackBar.open('Group deleted successfully', 'Close', { duration: 3000 });
          },
          error: (error) => {
            console.error('Delete failed:', error);
            this.snackBar.open('Error deleting group', 'Close', { duration: 3000 });
          }
        });
      }
    }
  ///add creategroup 
    createGroup() {
      const dialogRef = this.dialog.open(CreateGroupDialogComponent, {
        width: '400px'
      });
    
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // First check if the group name exists
          this.groupService.checkGroupName(result.name).subscribe({
            next: () => {
              // Name is available, create the group
              this.groupService.createGroup(result).subscribe({
                next: (createdGroup) => {
                  console.log('Group created:', createdGroup);
                  this.loadGroups();
                  this.snackBar.open('Group created successfully', 'Close', {
                    duration: 3000
                  });
                },
                error: (error) => {
                  console.error('Error creating group:', error);
                  this.snackBar.open(error.message || 'Error creating group', 'Close', {
                    duration: 3000,
                    panelClass: ['error-snackbar']
                  });
                }
              });
            },
            error: (error) => {
              console.error('Error checking group name:', error);
              if (error.message.includes('already exists')) {
                const dialogComponent = dialogRef.componentInstance as CreateGroupDialogComponent;
                dialogComponent.setDuplicateError();
              }
            }
          });
        }
      });
    }
    ///added creategroup 

    createTestGroup() {
      this.isLoading = true;
      const headers = this.getAuthHeaders();
      this.http.post('http://localhost:3000/api/groups/createTest', {}, { headers }).subscribe({
        next: (response) => {
          console.log('Group created:', response);
          this.loadGroups();
        },
        error: (error) => {
          console.error('Error creating group:', error);
          this.isLoading = false;
        }
      });
    }
  
    ///////added 
    createChannel() {
      if (!this.selectedGroup) return;
      
      const dialogRef = this.dialog.open(CreateChannelDialogComponent, {
        width: '400px'
      });
    
      dialogRef.afterClosed().subscribe((result?: { name: string; description?: string }) => {
        if (result) {
          // Check if channel name already exists in the group
          const channelExists = this.selectedGroup?.channels?.some(
            channel => channel.name.toLowerCase() === result.name.toLowerCase()
          );
    
          if (channelExists) {
            const dialogComponent = dialogRef.componentInstance as CreateChannelDialogComponent;
            dialogComponent.setDuplicateError();
            return;
          }
    
          this.isLoading = true;
          this.groupService.addChannel(this.selectedGroup!._id, result).subscribe({
            next: (updatedGroup: Group) => {
              console.log('Channel created, updated group:', updatedGroup);
              this.selectedGroup = updatedGroup;
              this.loadGroups();
              this.snackBar.open('Channel created successfully', 'Close', {
                duration: 3000
              });
              this.isLoading = false;
            },
            error: (error: Error) => {
              console.error('Error creating channel:', error);
              this.isLoading = false;
              const errorMessage = error.message || 'Error creating channel';
              this.snackBar.open(errorMessage, 'Close', {
                duration: 3000,
                panelClass: ['error-snackbar']
              });
            }
          });
        }
      });
    }


  
  
    selectChannel(channel: Channel | any) {
      if (!channel?._id || !this.selectedGroup?.isMember) return;
      
      console.log('Selecting channel:', channel);
      this.selectedChannel = channel;
      this.isLoading = true;
      this.messages = [];
      
      this.socketService.joinChannel(channel._id);
    
      const headers = this.getAuthHeaders();
      this.http.get(`http://localhost:3000/api/channels/${channel._id}/messages`, { headers })
        .subscribe({
          next: (messages: any) => {
            console.log('Messages received:', messages);
            this.messages = messages || [];
            this.isLoading = false;
            setTimeout(() => this.scrollToBottom(), 100);
          },
          error: (error) => {
            console.error('Error loading messages:', error);
            this.isLoading = false;
            this.messages = [];
          }
        });
    }
  
    sendMessage() {
      if (!this.newMessage.trim() || !this.selectedChannel || !this.selectedGroup?.isMember) return;
  
      const headers = this.getAuthHeaders();
      const message = {
        content: this.newMessage,
        channelId: this.selectedChannel._id
      };
  
      this.http.post(
        `http://localhost:3000/api/channels/${this.selectedChannel._id}/messages`, 
        { content: this.newMessage }, 
        { headers }
      ).subscribe({
        next: (response) => {
          console.log('Message sent:', response);
          this.socketService.sendMessage(message);
          this.newMessage = '';
        },
        error: (error) => console.error('Error sending message:', error)
      });
    }
    openVideoChat() {
      const dialogRef = this.dialog.open(VideoChatComponent, {
        width: '100%',
        height: '100%',
        maxWidth: '100vw',
        maxHeight: '100vh',
        panelClass: 'full-screen-dialog'
      });
    
      dialogRef.afterClosed().subscribe(() => {
        console.log('Video chat closed');
      });
    }
    private getAuthHeaders(): HttpHeaders {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return new HttpHeaders({
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      });
    }

// Add/update these methods in your ChatRoomComponent

async onFileSelected(event: any) {
  const file = event.target.files[0];
  if (file && this.selectedChannel && this.selectedGroup?.isMember) {
    if (!this.validateFile(file)) {
      this.snackBar.open('Please upload only image files (JPG, PNG, GIF)', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      this.fileInput.nativeElement.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('File size should not exceed 5MB', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      this.fileInput.nativeElement.value = '';
      return;
    }

    this.isLoading = true;

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Create headers without Content-Type to let the browser set it with boundary
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('currentUser') || '{}').token}`
      });

      const response: any = await this.http.post(
        `http://localhost:3000/api/channels/${this.selectedChannel._id}/upload`, 
        formData, 
        { headers }
      );

      // Show preview of uploaded image
      this.showImagePreview(response.imageUrl);

      // Send the message through socket
      
      const message = {
        content: response.imageUrl,
        channelId: this.selectedChannel._id,
        messageType: 'image'
      };

      this.socketService.sendMessage(message);
      
      this.snackBar.open('Image uploaded successfully', 'Close', {
        duration: 3000
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      this.snackBar.open(
        error.error?.error || 'Error uploading image', 
        'Close',
        {
          duration: 3000,
          panelClass: ['error-snackbar']
        }
      );
    } finally {
      this.isLoading = false;
      this.fileInput.nativeElement.value = '';
    }
  }
}

private validateFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  return validTypes.includes(file.type);
}


private showImagePreview(imageUrl: string): void {
  // Optional: Show a preview of the uploaded image in the chat
  console.log('Image received:', imageUrl);
  const previewMessage = {
    content: imageUrl,
    sender: {
      _id: JSON.parse(localStorage.getItem('currentUser') || '{}')._id,
      username: JSON.parse(localStorage.getItem('currentUser') || '{}').username
    },
    timestamp: new Date(),
    messageType: 'image',

    

  };
  
  
  this.messages.push(previewMessage);
  setTimeout(() => this.scrollToBottom(), 100);
  }
  requestPromotion(group: Group, event: Event): void {
    event.stopPropagation();
    this.groupService.requestGroupAdminPromotion(group._id).subscribe({
        next: (response: PromotionResponse) => {
            this.pendingRequests[group._id] = true;
            this.snackBar.open(response.message || 'Admin promotion request submitted', 'Close', {
                duration: 3000
            });
        },
        error: (error: PromotionError) => {
            console.error('Error requesting promotion:', error);
            this.snackBar.open(error.message || 'Error requesting promotion', 'Close', {
                duration: 3000
            });
        }
    });
}

hasPendingRequest(groupId: string): boolean {
    return this.pendingRequests[groupId] || false;
}

isCurrentUserSuperAdmin(): boolean {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
 // console.log('Checking super admin status:', currentUser);//
  return currentUser?.user?.roles?.includes('super_admin') || false;
}

viewPromotionRequests() {
    const dialogRef = this.dialog.open(AdminDashboardComponent, {
        width: '800px',
        height: '600px'
    });

    dialogRef.afterClosed().subscribe(() => {
        this.loadGroups();
    });
}

viewJoinRequests(group: Group, event?: MouseEvent) {
  if (event) {
      event.stopPropagation(); // Prevent group selection when clicking the button
  }
  console.log('Opening join requests dialog for group:', group._id);
  const dialogRef = this.dialog.open(JoinRequestsDialogComponent, {
      width: '600px',
      data: { groupId: group._id }
  });

  dialogRef.afterClosed().subscribe((result) => {
      if (result?.refresh) {
          // Force refresh the specific group
          this.groupService.getGroups().subscribe({
              next: (groups) => {
                  this.groups = groups;
                  if (this.selectedGroup && this.selectedGroup._id === result.groupId) {
                      const updatedGroup = groups.find(g => g._id === result.groupId);
                      if (updatedGroup) {
                          this.selectedGroup = updatedGroup;
                          console.log('Updated selected group:', this.selectedGroup);
                      }
                  }
              },
              error: (error) => {
                  console.error('Error refreshing groups:', error);
              }
          });
      }
  });
}
private readonly colors = [
  '#1976d2', '#388e3c', '#d32f2f', '#7b1fa2',    
  '#c2185b', '#0288d1', '#00796b', '#f57c00' 
];  

getCurrentUsername(): string {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  return currentUser?.user?.username || currentUser?.username || 'User';
}

getInitial(): string {
  const username = this.getCurrentUsername();
  return username.charAt(0).toUpperCase();
}

getProfileColor(): string {
  const username = this.getCurrentUsername();
  const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return this.colors[index % this.colors.length];
}

logout(): void {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('token');
  this.socketService.disconnect();
  this.snackBar.open('Successfully logged out', 'Close', {
    duration: 3000
  });
  window.location.href = '/login';
}
viewManageMembers(group: Group, event: Event): void {
  event.stopPropagation();
  const dialogRef = this.dialog.open(ManageMembersDialogComponent, {
    width: '500px',
    data: { group }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.loadGroups();
    }
  });
}
}
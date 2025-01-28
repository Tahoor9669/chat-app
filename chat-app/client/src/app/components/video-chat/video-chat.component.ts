import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip'; // Add this
import { MatFormFieldModule } from '@angular/material/form-field'; // Add this
import { Peer, MediaConnection } from 'peerjs';
import { MatCardModule } from '@angular/material/card';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-video-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,    // Add this
    MatFormFieldModule,   // Add this
    MatCardModule  // Add this
  ],
  template: `
  <div class="video-chat-container">
  <button mat-icon-button 
        class="back-button" 
        (click)="goBack()" 
        matTooltip="Back to Chat">
  <mat-icon>arrow_back</mat-icon>
</button>
    <div class="video-grid">
      <!-- Local Video -->
      <div class="video-card local">
        <video #localVideo autoplay playsinline muted></video>
        <div class="video-overlay">
          <div class="participant-info">
            <div class="participant-avatar">
              <mat-icon>person</mat-icon>
            </div>
            <span>You</span>
          </div>
          <div class="stream-status" *ngIf="!isVideoEnabled">
            <mat-icon>videocam_off</mat-icon>
            Camera Off
          </div>
        </div>
      </div>

      <!-- Remote Video -->
      <div class="video-card remote" *ngIf="isInCall">
        <video #remoteVideo autoplay playsinline></video>
        <div class="video-overlay">
          <div class="participant-info">
            <div class="participant-avatar">
              <mat-icon>person_outline</mat-icon>
            </div>
            <span>Remote User</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Call Setup UI -->
    <div class="call-setup" *ngIf="!isInCall">
      <mat-card>
        <mat-card-content>
          <div class="peer-id-display">
            <h2>Your Room ID</h2>
            <div class="id-box">
              <span>{{ peerId }}</span>
              <button mat-icon-button (click)="copyPeerId()" matTooltip="Copy ID">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
          </div>

          <div class="join-call">
            <h2>Join a Call</h2>
            <mat-form-field appearance="outline">
              <mat-label>Enter Room ID</mat-label>
              <input matInput [(ngModel)]="remotePeerId" placeholder="Room ID">
              <mat-icon matSuffix>meeting_room</mat-icon>
            </mat-form-field>
            <button mat-flat-button color="primary" 
                    (click)="startCall()" 
                    [disabled]="!remotePeerId">
              <mat-icon>call</mat-icon>
              Join Call
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Video Controls -->
    <div class="video-controls">
      <div class="control-bar">
        <button mat-fab 
                [color]="isAudioEnabled ? 'primary' : 'warn'"
                (click)="toggleAudio()" 
                [matTooltip]="isAudioEnabled ? 'Mute' : 'Unmute'">
          <mat-icon>{{ isAudioEnabled ? 'mic' : 'mic_off' }}</mat-icon>
        </button>

        <button mat-fab 
                [color]="isVideoEnabled ? 'primary' : 'warn'"
                (click)="toggleVideo()" 
                [matTooltip]="isVideoEnabled ? 'Turn off camera' : 'Turn on camera'">
          <mat-icon>{{ isVideoEnabled ? 'videocam' : 'videocam_off' }}</mat-icon>
        </button>

        <button mat-fab 
                color="warn" 
                (click)="endCall()" 
                matTooltip="End call"
                *ngIf="isInCall">
          <mat-icon>call_end</mat-icon>
        </button>
      </div>
    </div>
  </div>
`,

styles: [`
.back-button {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255,255,255,0.1);
  color: white;
  z-index: 100;
}
  .video-chat-container {
    height: 100vh;
    background: #1a1a1a;
    display: flex;
    flex-direction: column;
    padding: 24px;
    gap: 24px;
    position: relative;
  }

  .video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 24px;
    flex: 1;
  }

  .video-card {
    position: relative;
    background: #2a2a2a;
    border-radius: 16px;
    overflow: hidden;
    aspect-ratio: 16/9;

    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &.local video {
      transform: scaleX(-1);
    }
  }

  .video-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 16px;
    color: white;
  }

  .participant-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.1rem;
  }

  .participant-avatar {
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stream-status {
    position: absolute;
    top: 16px;
    left: 16px;
    background: rgba(0,0,0,0.6);
    padding: 8px 16px;
    border-radius: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
  }

  .call-setup {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;

    mat-card {
      width: 100%;
      max-width: 400px;
      background: #2a2a2a;
      color: white;
    }
  }

  .peer-id-display, .join-call {
    padding: 24px 0;
    text-align: center;

    h2 {
      margin: 0 0 16px 0;
      font-size: 1.25rem;
      color: #e0e0e0;
    }
  }

  .id-box {
    background: #1a1a1a;
    padding: 12px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: monospace;
    font-size: 1.2rem;
  }

  mat-form-field {
    width: 100%;
    margin-bottom: 16px;

    ::ng-deep {
      .mat-form-field-wrapper {
        margin: 0;
      }
      .mat-form-field-outline {
        color: rgba(255,255,255,0.2);
      }
      .mat-form-field-label {
        color: rgba(255,255,255,0.6);
      }
      input {
        color: white;
      }
    }
  }

  .video-controls {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 24px;
    display: flex;
    justify-content: center;
  }

  .control-bar {
    background: rgba(0,0,0,0.8);
    padding: 16px 32px;
    border-radius: 36px;
    display: flex;
    gap: 16px;

    button {
      transform: scale(1);
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.1);
      }
    }
  }

  @media (max-width: 768px) {
    .video-grid {
      grid-template-columns: 1fr;
    }

    .video-card {
      aspect-ratio: 4/3;
    }
  }
`]
})
export class VideoChatComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  peer!: Peer;
  peerId: string = '';
  remotePeerId: string = '';
  localStream?: MediaStream;
  remoteStream?: MediaStream;  // Change this line (for fix #3)
  currentCall?: MediaConnection;
  isInCall: boolean = false;
  isVideoEnabled: boolean = true;
  isAudioEnabled: boolean = true;

  constructor(
    private snackBar: MatSnackBar,
    private router: Router
  ) {}
  
  goBack() {
    this.router.navigate(['/chat']);
  }

  ngOnInit() {
    this.initializePeer();
    this.setupLocalStream();
  }

  private async initializePeer() {
    this.peer = new Peer('', {
      host: 'localhost',
      port: 3000,
      path: '/peerjs',
      secure: false,
      debug: 3,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          {
            urls: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com'
          }
        ],
        sdpSemantics: 'unified-plan',
        iceTransportPolicy: 'all'
      }
    });

    this.peer.on('open', (id) => {
      console.log('Connected to PeerJS server with ID:', id);
      this.peerId = id;
      this.snackBar.open('Connected to video server', 'Close', { duration: 3000 });
    });

    this.peer.on('disconnected', () => {
      console.log('Disconnected from peer server, attempting to reconnect...');
      this.snackBar.open('Connection lost, attempting to reconnect...', 'Close', { duration: 3000 });
      setTimeout(() => {
        this.peer.reconnect();
      }, 3000);
    });

    this.peer.on('call', async (call) => {
      if (confirm('Incoming call. Accept?')) {
        this.currentCall = call;
        this.isInCall = true;
        
        if (!this.localStream) {
          await this.setupLocalStream();
        }
        
        call.answer(this.localStream);
        this.handleCall(call);
      }
    });

    this.peer.on('error', (error) => {
      console.error('Peer connection error:', error);
      this.snackBar.open(`Connection error: ${error.type}`, 'Close', {
        duration: 5000
      });
    });

    this.peer.on('close', () => {
      console.log('Peer connection closed');
      this.snackBar.open('Connection closed', 'Close', { duration: 3000 });
    });
}

  private async setupLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (this.localVideo?.nativeElement) {
        this.localVideo.nativeElement.srcObject = this.localStream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      this.snackBar.open('Error accessing camera and microphone', 'Close', {
        duration: 5000
      });
    }
  }

  async startCall() {
    if (!this.localStream) {
      await this.setupLocalStream();
    }

    if (this.localStream && this.remotePeerId) {
      try {
        const call = this.peer.call(this.remotePeerId, this.localStream);
        this.currentCall = call;
        this.isInCall = true;
        this.handleCall(call);
      } catch (error) {
        console.error('Error making call:', error);
        this.snackBar.open('Error making call', 'Close', {
          duration: 5000
        });
      }
    }
  }

  private handleCall(call: MediaConnection) {
    call.on('stream', (stream: MediaStream) => {
      if (this.remoteVideo?.nativeElement) {
        this.remoteVideo.nativeElement.srcObject = stream;
        this.remoteStream = stream;
        console.log('Remote stream connected:', stream.id);
      }
    });
  
    call.on('close', () => {
      console.log('Call closed by remote peer');
      this.endCall();
    });
  
    call.on('error', (err: Error) => {
      console.error('Call error:', err);
      this.snackBar.open('Call error: ' + err.message, 'Close', {
        duration: 5000
      });
      this.endCall();
    });

    // Add connection monitoring
    const monitor = setInterval(() => {
      if (call.peerConnection) {
        const state = call.peerConnection.connectionState;
        if (state === 'failed' || state === 'closed') {
          console.log('Connection state:', state);
          clearInterval(monitor);
          this.endCall();
          this.snackBar.open('Call connection lost', 'Close', { duration: 3000 });
        }
      }
    }, 1000);
}

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.isVideoEnabled = videoTrack.enabled;
      }
    }
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.isAudioEnabled = audioTrack.enabled;
      }
    }
  }

  endCall() {
    console.log('Ending call...');
    if (this.currentCall) {
      this.currentCall.close();
    }
    this.currentCall = undefined;
    if (this.remoteVideo?.nativeElement) {
      this.remoteVideo.nativeElement.srcObject = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = undefined;
    }
    this.isInCall = false;
    this.remotePeerId = '';
    console.log('Call ended');
}

  copyPeerId() {
    navigator.clipboard.writeText(this.peerId).then(() => {
      this.snackBar.open('Peer ID copied to clipboard', 'Close', {
        duration: 2000
      });
    });
  }

  ngOnDestroy() {
    this.endCall();
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.peer && !this.peer.destroyed) {
      this.peer.destroy();
    }
  }
}
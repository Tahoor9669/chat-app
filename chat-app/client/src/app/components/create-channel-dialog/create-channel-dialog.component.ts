import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-create-channel-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Create New Channel</h2>
      
      <form [formGroup]="channelForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Channel Name</mat-label>
            <input matInput formControlName="name" placeholder="Enter channel name"
                   [attr.aria-label]="'Channel name'">
            <mat-error *ngIf="channelForm.get('name')?.hasError('required')">
              Channel name is required
            </mat-error>
            <mat-error *ngIf="channelForm.get('name')?.hasError('minlength')">
              Channel name must be at least 3 characters
            </mat-error>
            <mat-error *ngIf="channelForm.get('name')?.hasError('duplicate')">
              This channel name already exists in this group
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description"
                      placeholder="Enter channel description"
                      rows="3"
                      [attr.aria-label]="'Channel description'">
            </textarea>
          </mat-form-field>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button mat-raised-button color="primary"
                  type="submit"
                  [disabled]="channelForm.invalid">
            Create Channel
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 20px;
      min-width: 350px;
      max-width: 500px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    mat-dialog-actions {
      margin: 20px -24px -24px;
      padding: 20px 24px;
    }
    textarea {
      resize: none;
    }
    mat-form-field {
      display: block;
    }
  `]
})
export class CreateChannelDialogComponent {
  channelForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateChannelDialogComponent>
  ) {
    this.channelForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });
  }

  onSubmit(): void {
    if (this.channelForm.valid) {
      this.dialogRef.close(this.channelForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  setDuplicateError(): void {
    this.channelForm.get('name')?.setErrors({ duplicate: true });
  }
}
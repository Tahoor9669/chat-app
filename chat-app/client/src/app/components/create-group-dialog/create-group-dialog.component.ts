import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-create-group-dialog',
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Create New Group</h2>
      
      <form [formGroup]="groupForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Group Name</mat-label>
            <input matInput formControlName="name" placeholder="Enter group name">
            <mat-error *ngIf="groupForm.get('name')?.hasError('required')">
              Group name is required
            </mat-error>
            <mat-error *ngIf="groupForm.get('name')?.hasError('minlength')">
              Group name must be at least 3 characters
            </mat-error>
            <mat-error *ngIf="groupForm.get('name')?.hasError('duplicate')">
              This group name already exists
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" placeholder="Enter group description" rows="3"></textarea>
          </mat-form-field>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button (click)="onCancel()">Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="groupForm.invalid">
            Create Group
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 20px;
      min-width: 350px;
    }
    .full-width {
      width: 100%;
    }
    mat-dialog-actions {
      margin-top: 20px;
    }
  `],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  standalone: true
})
export class CreateGroupDialogComponent {
  groupForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateGroupDialogComponent>
  ) {
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });
  }

  onSubmit() {
    if (this.groupForm.valid) {
      this.dialogRef.close(this.groupForm.value);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  setDuplicateError() {
    this.groupForm.get('name')?.setErrors({ duplicate: true });
  }
}
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageMembersDialogComponent } from './manage-members-dialog.component';

describe('ManageMembersDialogComponent', () => {
  let component: ManageMembersDialogComponent;
  let fixture: ComponentFixture<ManageMembersDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageMembersDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageMembersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

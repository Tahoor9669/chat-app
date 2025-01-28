import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinRequestsDialogComponent } from './join-requests-dialog.component';

describe('JoinRequestsDialogComponent', () => {
  let component: JoinRequestsDialogComponent;
  let fixture: ComponentFixture<JoinRequestsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinRequestsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoinRequestsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

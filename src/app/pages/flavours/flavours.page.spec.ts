import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlavoursPage } from './flavours.page';

describe('FlavoursPage', () => {
  let component: FlavoursPage;
  let fixture: ComponentFixture<FlavoursPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FlavoursPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TelaHome } from './tela-home';

describe('TelaHome', () => {
  let component: TelaHome;
  let fixture: ComponentFixture<TelaHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelaHome],
    }).compileComponents();

    fixture = TestBed.createComponent(TelaHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

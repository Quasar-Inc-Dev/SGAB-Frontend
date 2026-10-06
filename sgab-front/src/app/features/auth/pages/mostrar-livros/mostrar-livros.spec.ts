import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MostrarLivros } from './mostrar-livros';

describe('MostrarLivros', () => {
  let component: MostrarLivros;
  let fixture: ComponentFixture<MostrarLivros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MostrarLivros],
    }).compileComponents();

    fixture = TestBed.createComponent(MostrarLivros);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../../../../core/services/auth.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getPayload',
      'getEmail',
      'getUserId',
      'getRoles',
      'logout',
    ]);
    authService.getPayload.and.returnValue({ sub: 'user@forme.tn', uid: 5, roles: ['ROLE_USER'] });
    authService.getEmail.and.returnValue('user@forme.tn');
    authService.getUserId.and.returnValue(5);
    authService.getRoles.and.returnValue(['ROLE_USER']);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [{ provide: AuthService, useValue: authService }],
    })
    .overrideComponent(ProfileComponent, { set: { template: '' } })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reads profile data from AuthService', () => {
    expect(component.email).toBe('user@forme.tn');
    expect(component.uid).toBe(5);
    expect(component.roles).toEqual(['ROLE_USER']);
    expect(component.payload?.sub).toBe('user@forme.tn');
  });

  it('delegates logout to AuthService', () => {
    component.logout();

    expect(authService.logout).toHaveBeenCalled();
  });
});

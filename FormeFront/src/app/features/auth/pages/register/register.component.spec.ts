import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../../../core/services/auth.service';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    (window as any).grecaptcha = {
      render: jasmine.createSpy('render'),
      reset: jasmine.createSpy('reset'),
    };

    authService = jasmine.createSpyObj<AuthService>('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    })
      .overrideComponent(RegisterComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => {
    delete (window as any).grecaptcha;
  });

  it('should create and render reCAPTCHA on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect((window as any).grecaptcha.render).toHaveBeenCalled();
  });

  it('does not submit an invalid form', () => {
    component.submit();

    expect(component.form.touched).toBeTrue();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('requires captcha before registration', () => {
    component.form.setValue({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@forme.tn',
      password: 'Password123!',
      profession: 'STUDENT',
      partnerID: null,
      partnerCode: '',
    });

    component.submit();

    expect(component.captchaError).toBeTrue();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('registers valid data and navigates to login', () => {
    authService.register.and.returnValue(of(void 0));
    component.captchaToken = 'captcha-token';
    component.form.setValue({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@forme.tn',
      password: 'Password123!',
      profession: 'DEVELOPER',
      partnerID: null,
      partnerCode: '  ',
    });

    component.submit();

    expect(authService.register).toHaveBeenCalledOnceWith({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@forme.tn',
      password: 'Password123!',
      profession: 'DEVELOPER' as any,
      partnerID: null,
      partnerCode: null,
      captchaToken: 'captcha-token',
    });
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login']);
    expect(component.loading).toBeFalse();
  });

  it('shows backend error and resets captcha after registration failure', () => {
    authService.register.and.returnValue(throwError(() => ({ error: { message: 'Email already exists' } })));
    component.captchaToken = 'captcha-token';
    component.form.setValue({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@forme.tn',
      password: 'Password123!',
      profession: 'STUDENT',
      partnerID: null,
      partnerCode: '',
    });

    component.submit();

    expect(component.error).toBe('Email already exists');
    expect(component.captchaToken).toBeNull();
    expect((window as any).grecaptcha.reset).toHaveBeenCalled();
  });
});

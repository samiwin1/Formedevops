import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../shop/services/cart.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let cartService: jasmine.SpyObj<CartService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'getUserId',
      'getRoles',
      'isAdmin',
      'isEvaluator',
      'isUser',
    ]);
    cartService = jasmine.createSpyObj<CartService>('CartService', ['refreshCartCount']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: CartService, useValue: cartService },
      ],
    })
      .overrideComponent(LoginComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(console, 'log');
    spyOn(console, 'error');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('marks the form as touched when submitting invalid data', () => {
    component.submit();

    expect(component.form.touched).toBeTrue();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('logs in an admin, refreshes cart count, and navigates to dashboard', () => {
    authService.login.and.returnValue(of({ token: 'token' }));
    authService.getUserId.and.returnValue(7);
    authService.getRoles.and.returnValue(['ROLE_ADMIN']);
    authService.isAdmin.and.returnValue(true);

    component.form.setValue({ email: 'admin@forme.tn', password: 'Password123!' });
    component.submit();

    expect(authService.login).toHaveBeenCalledOnceWith({
      email: 'admin@forme.tn',
      password: 'Password123!',
    });
    expect(cartService.refreshCartCount).toHaveBeenCalledOnceWith(7);
    expect(router.navigate).toHaveBeenCalledOnceWith(['/admin/dashboard']);
    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
  });

  it('shows an authentication error when backend rejects credentials', () => {
    authService.login.and.returnValue(throwError(() => ({
      status: 401,
      error: { message: 'Invalid credentials' },
    })));

    component.form.setValue({ email: 'user@forme.tn', password: 'bad-password' });
    component.submit();

    expect(component.loading).toBeFalse();
    expect(component.error).toBe('Invalid credentials');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

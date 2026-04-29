import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { AdminOrderService } from '../../../core/services/admin-order.service';
import { ProductService } from '../../../core/services/product.service';
import { AdminApi } from '../../../core/services/admin.api';
import { DashboardService } from '../../../core/services/dashboard.service';
import { OralSessionService } from '../../../core/services/oral-session.service';
import { IssuedCertificationService } from '../../../core/services/issued-certification.service';
import { StatisticsService } from '../../../features/formation/services/statistics.service';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let orderService: jasmine.SpyObj<AdminOrderService>;
  let productService: jasmine.SpyObj<ProductService>;
  let adminApi: jasmine.SpyObj<AdminApi>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let oralSessionService: jasmine.SpyObj<OralSessionService>;
  let certService: jasmine.SpyObj<IssuedCertificationService>;
  let statisticsService: jasmine.SpyObj<StatisticsService>;
  let httpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(async () => {
    orderService = jasmine.createSpyObj<AdminOrderService>('AdminOrderService', ['getAllOrders', 'getAllOrderItems']);
    productService = jasmine.createSpyObj<ProductService>('ProductService', ['listProducts']);
    adminApi = jasmine.createSpyObj<AdminApi>('AdminApi', ['list']);
    dashboardService = jasmine.createSpyObj<DashboardService>('DashboardService', ['getAdminStats']);
    oralSessionService = jasmine.createSpyObj<OralSessionService>('OralSessionService', ['list']);
    certService = jasmine.createSpyObj<IssuedCertificationService>('IssuedCertificationService', ['listForAdmin']);
    statisticsService = jasmine.createSpyObj<StatisticsService>('StatisticsService', ['getGlobalAnalytics']);
    httpClient = jasmine.createSpyObj<HttpClient>('HttpClient', ['get']);

    orderService.getAllOrders.and.returnValue(of([
      { idOrder: 1, userId: 1, status: 'COMPLETED', totalAmount: 300, currency: 'TND', createdAt: new Date().toISOString() },
      { idOrder: 2, userId: 2, status: 'PENDING', totalAmount: 100, currency: 'TND', createdAt: new Date().toISOString() },
    ] as any));
    orderService.getAllOrderItems.and.returnValue(of([
      { quantity: 1, unitPriceSnapshot: 300, formationTitleSnapshot: 'Angular' },
    ] as any));
    productService.listProducts.and.returnValue(of([{ idProduct: 1, price: 300, currency: 'TND', isAvailable: true }] as any));
    adminApi.list.and.returnValue(of([
      { id: 1, firstName: 'Admin', lastName: 'One', email: 'admin@forme.tn', profession: 'DEVELOPER', active: true },
      { id: 2, firstName: 'User', lastName: 'Two', email: 'user@forme.tn', profession: 'STUDENT', active: false },
    ]));
    dashboardService.getAdminStats.and.returnValue(of({ issuedCertifications: 5, oralSessionsPlanned: 2 } as any));
    certService.listForAdmin.and.returnValue(of([{ id: 1 }] as any));
    oralSessionService.list.and.returnValue(of([]));
    statisticsService.getGlobalAnalytics.and.returnValue(of({
      trainingCompletion: {
        totalStarted: 10,
        totalCompleted: 7,
        completionRatePercent: 70,
        topCompletedFormations: [],
        topAbandonedFormations: [],
      },
      assessmentSuccess: {
        totalAttempts: 8,
        passedAttempts: 6,
        successRatePercent: 75,
        averageScore: 82,
        evaluationsWithHighFailure: [],
      },
      examAnalysis: null,
      learningObstacles: null,
    } as any));
    httpClient.get.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AdminOrderService, useValue: orderService },
        { provide: ProductService, useValue: productService },
        { provide: AdminApi, useValue: adminApi },
        { provide: DashboardService, useValue: dashboardService },
        { provide: OralSessionService, useValue: oralSessionService },
        { provide: IssuedCertificationService, useValue: certService },
        { provide: StatisticsService, useValue: statisticsService },
        { provide: HttpClient, useValue: httpClient },
      ],
    })
      .overrideComponent(DashboardComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads dashboard data from services and computes summary metrics', () => {
    component.loadAll();

    expect(orderService.getAllOrders).toHaveBeenCalled();
    expect(productService.listProducts).toHaveBeenCalled();
    expect(adminApi.list).toHaveBeenCalled();
    expect(statisticsService.getGlobalAnalytics).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
    expect(component.data.totalRevenue).toBe(400);
    expect(component.data.totalOrders).toBe(2);
    expect(component.data.completedOrders).toBe(1);
    expect(component.data.pendingOrders).toBe(1);
    expect(component.data.totalUsers).toBe(2);
    expect(component.data.issuedCerts).toBe(5);
    expect(component.completionRate).toBe(70);
    expect(component.passRate).toBe(75);
  });
});

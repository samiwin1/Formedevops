import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { NotificationDashboardService } from './notification-dashboard.service';

describe('NotificationDashboardService', () => {
  let service: NotificationDashboardService;
  let httpMock: HttpTestingController;
  const base = '/api/admin/dashboard/notifications';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationDashboardService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(NotificationDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('gets all notifications', () => {
    service.getAll().subscribe((rows) => expect(rows.length).toBe(1));

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, title: 'Info', message: 'Hello', type: 'INFO', isRead: false, targetUserEmail: null, createdAt: 'now' }]);
  });

  it('gets unread notification count', () => {
    service.countUnread().subscribe((count) => expect(count.unread).toBe(3));

    const req = httpMock.expectOne(`${base}/count`);
    expect(req.request.method).toBe('GET');
    req.flush({ unread: 3 });
  });

  it('creates, marks read, marks all read, and deletes notifications', () => {
    service.create({ title: 'Warning', message: 'Check this', type: 'WARNING' }).subscribe();
    let req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('Warning');
    req.flush({});

    service.markRead(5).subscribe();
    req = httpMock.expectOne(`${base}/5/read`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    service.markAllRead().subscribe();
    req = httpMock.expectOne(`${base}/read-all`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);

    service.delete(5).subscribe();
    req = httpMock.expectOne(`${base}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Announcement, AnnouncementService } from './announcement.service';

describe('AnnouncementService', () => {
  let service: AnnouncementService;
  let httpMock: HttpTestingController;
  const base = '/api/admin/dashboard/announcements';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AnnouncementService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AnnouncementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('normalizes list responses from wrapped payloads', () => {
    service.getAll().subscribe((rows) => {
      expect(rows.length).toBe(1);
      expect(rows[0].title).toBe('Published news');
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [announcement()] });
  });

  it('requests announcements by status with query params', () => {
    service.getByStatus('PUBLISHED').subscribe();

    const req = httpMock.expectOne((request) =>
      request.url === `${base}/by-status` && request.params.get('status') === 'PUBLISHED'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('creates and publishes announcements', () => {
    service.create('Draft', 'Content', true, 'admin@forme.tn').subscribe();
    let req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      title: 'Draft',
      content: 'Content',
      pinned: true,
      status: 'DRAFT',
      createdByEmail: 'admin@forme.tn',
    });
    req.flush(announcement());

    service.publish(10).subscribe();
    req = httpMock.expectOne(`${base}/10/publish`);
    expect(req.request.method).toBe('PATCH');
    req.flush(announcement());
  });

  it('saves and deletes announcements', () => {
    const item = announcement();

    service.save(item).subscribe();
    let req = httpMock.expectOne(`${base}/${item.id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.title).toBe(item.title);
    req.flush(item);

    service.delete(item.id).subscribe();
    req = httpMock.expectOne(`${base}/${item.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  function announcement(): Announcement {
    return {
      id: 10,
      title: 'Published news',
      content: 'Content',
      status: 'PUBLISHED',
      pinned: false,
      createdByEmail: 'admin@forme.tn',
      createdAt: '2026-01-01T00:00:00Z',
      publishedAt: '2026-01-02T00:00:00Z',
    };
  }
});

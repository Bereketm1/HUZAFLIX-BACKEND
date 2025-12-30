import { buildActivityMessage } from './activity-message';
import { AuditEvent } from '@huzaflix/common';

describe('buildActivityMessage', () => {
  it('creates a clear message for API management list APIs', () => {
    const msg = buildActivityMessage({
      event: AuditEvent.API_MANAGEMENT,
      status: 200,
      metadata: {
        path: '/api/api-management/apis',
        method: 'GET',
      },
    } as any);

    expect(msg).toBe('Viewed APIs succeeded (HTTP 200)');
  });

  it('creates a clear message for login failure', () => {
    const msg = buildActivityMessage({
      event: AuditEvent.LOGIN,
      status: 401,
      metadata: {
        path: '/api/auth/login',
        method: 'POST',
      },
    } as any);

    expect(msg).toBe('Login failed (unauthorized) (HTTP 401)');
  });

  it('falls back to a generic request message', () => {
    const msg = buildActivityMessage({
      event: AuditEvent.REQUEST,
      status: 500,
      metadata: {
        path: '/api/somewhere',
        method: 'PATCH',
      },
    } as any);

    expect(msg).toBe('Request failed (server error) (HTTP 500)');
  });
});

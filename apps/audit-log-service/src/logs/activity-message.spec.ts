import { buildActivityMessage } from './activity-message';
import { AuditEvent } from '@huzaflix/common';
import type { AuditLog } from './audit-log.entity';

const makeLog = (log: Pick<AuditLog, 'event' | 'status' | 'metadata'>) => log;

describe('buildActivityMessage', () => {
  it('creates a clear message for API management list APIs', () => {
    const msg = buildActivityMessage(
      makeLog({
        event: AuditEvent.API_MANAGEMENT,
        status: 200,
        metadata: {
          path: '/api/api-management/apis',
          method: 'GET',
        },
      }),
    );

    expect(msg).toBe('Viewed APIs succeeded (HTTP 200)');
  });

  it('creates a clear message for login failure', () => {
    const msg = buildActivityMessage(
      makeLog({
        event: AuditEvent.LOGIN,
        status: 401,
        metadata: {
          path: '/api/auth/login',
          method: 'POST',
        },
      }),
    );

    expect(msg).toBe('Login failed (unauthorized) (HTTP 401)');
  });

  it('falls back to a generic request message', () => {
    const msg = buildActivityMessage(
      makeLog({
        event: AuditEvent.REQUEST,
        status: 500,
        metadata: {
          path: '/api/somewhere',
          method: 'PATCH',
        },
      }),
    );

    expect(msg).toBe('Request failed (server error) (HTTP 500)');
  });
});

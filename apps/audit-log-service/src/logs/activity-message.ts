import { AuditEvent } from '@huzaflix/common';
import type { AuditLog } from './audit-log.entity';

function getPathAndMethod(log: Pick<AuditLog, 'metadata'>): {
  path?: string;
  method?: string;
} {
  const meta = log.metadata;
  if (!meta || typeof meta !== 'object') return {};

  const path = typeof meta.path === 'string' ? meta.path : undefined;
  const method = typeof meta.method === 'string' ? meta.method : undefined;

  return { path, method };
}

function statusLabel(status: number): 'succeeded' | 'failed' {
  return status >= 200 && status < 400 ? 'succeeded' : 'failed';
}

function statusReason(status: number): string | undefined {
  // Keep this intentionally small and human-friendly.
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'redirected';

  switch (status) {
    case 400:
      return 'bad request';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not found';
    case 409:
      return 'conflict';
    case 422:
      return 'validation error';
    case 429:
      return 'rate limited';
    default:
      break;
  }

  if (status >= 500) return 'server error';
  if (status >= 400) return 'error';
  return undefined;
}

function withOutcome(action: string, status: number): string {
  const outcome = statusLabel(status);
  const reason = statusReason(status);
  if (reason && !(status >= 200 && status < 300)) {
    return `${action} ${outcome} (${reason}) (HTTP ${status})`;
  }
  return `${action} ${outcome} (HTTP ${status})`;
}

function describeAuth(path?: string, method?: string): string {
  const p = (path || '').toLowerCase();
  const m = (method || '').toUpperCase();

  if (p.includes('/auth/login')) return 'Login';
  if (p.includes('/auth/logout')) return 'Logout';
  if (p.includes('/auth/register')) return 'Account registration';
  if (p.includes('/auth/refresh')) return 'Token refresh';
  if (p.includes('/auth/me')) return 'Profile access';
  if (p.includes('/auth/forgot-password')) return 'Password reset request';
  if (p.includes('/auth/reset-password')) return 'Password reset';
  if (p.includes('/auth/update-password')) return 'Password change';
  if (p.includes('/auth/real-email')) return 'Email verification';

  if (p.includes('/mfa/verify')) return 'MFA verification';
  if (p.includes('/mfa/resend')) return 'MFA code resend';

  if (p.includes('/auth/google/callback')) return 'Google login callback';
  if (p.includes('/auth/google')) return 'Google login';

  if (p.includes('/auth')) {
    if (m === 'GET') return 'Authentication check';
    return 'Authentication action';
  }

  return 'Authentication activity';
}

function describeApiManagement(path?: string, method?: string): string {
  const p = (path || '').toLowerCase();
  const m = (method || '').toUpperCase();

  if (p.includes('/consumer-api-keys')) {
    if (m === 'POST') return 'API key generated';
    if (m === 'PATCH') return 'API key updated';
    if (m === 'DELETE') return 'API key deleted';
    return 'API key activity';
  }

  if (p.includes('/subscriptions')) {
    if (p.includes('/renew')) return 'Subscription renewed';
    if (p.includes('/cancel')) return 'Subscription cancelled';
    if (p.includes('/increment')) return 'Subscription usage incremented';
    if (m === 'POST') return 'Subscription created';
    if (m === 'PUT' || m === 'PATCH') return 'Subscription updated';
    return 'Subscription activity';
  }

  if (p.includes('/plans')) {
    if (p.includes('/activate')) return 'Subscription plan activated';
    if (p.includes('/deactivate')) return 'Subscription plan deactivated';
    if (m === 'POST') return 'Subscription plan created';
    if (m === 'PUT' || m === 'PATCH') return 'Subscription plan updated';
    if (m === 'DELETE') return 'Subscription plan deleted';
    return 'Subscription plan activity';
  }

  if (p.includes('/apis')) {
    if (p.includes('/activate')) return 'API activated';
    if (p.includes('/deactivate')) return 'API deactivated';
    if (p.includes('/add-favourites')) return 'API added to favourites';
    if (p.includes('/remove-favourites')) return 'API removed from favourites';

    if (m === 'POST') return 'API created';
    if (m === 'PUT' || m === 'PATCH') return 'API updated';
    if (m === 'DELETE') return 'API deleted';
    if (m === 'GET') {
      if (p.includes('/pricing/')) return 'Viewed API pricing';
      if (p.includes('/favourites')) return 'Viewed favourite APIs';
      return 'Viewed APIs';
    }
    return 'API activity';
  }

  return 'API management activity';
}

export function buildActivityMessage(
  log: Pick<AuditLog, 'event' | 'status' | 'metadata'>,
): string {
  const { path, method } = getPathAndMethod(log);

  switch (log.event) {
    case AuditEvent.LOGIN:
      return withOutcome('Login', log.status);

    case AuditEvent.PAYMENT:
      return withOutcome('Payment', log.status);

    case AuditEvent.API_KEY_GEN:
      return withOutcome('API key generation', log.status);

    case AuditEvent.SUB_UPDATE:
      return withOutcome('Subscription update', log.status);

    case AuditEvent.API_MANAGEMENT: {
      const base = describeApiManagement(path, method);
      return withOutcome(base, log.status);
    }

    case AuditEvent.ADMIN_ACTION:
      return withOutcome('Admin action', log.status);

    case AuditEvent.REQUEST: {
      // Prefer plain-English descriptions over raw URLs.
      const p = (path || '').toLowerCase();
      if (
        p.includes('/api/auth') ||
        p.includes('/auth') ||
        p.includes('/mfa')
      ) {
        return withOutcome(describeAuth(path, method), log.status);
      }
      if (p.includes('/api/payment') || p.includes('/payment')) {
        return withOutcome('Payment request', log.status);
      }
      if (p.includes('/api/api-management') || p.includes('/api-management')) {
        return withOutcome('API management request', log.status);
      }
      return withOutcome('Request', log.status);
    }

    default: {
      const p = (path || '').toLowerCase();
      if (
        p.includes('/api/auth') ||
        p.includes('/auth') ||
        p.includes('/mfa')
      ) {
        return withOutcome(describeAuth(path, method), log.status);
      }
      if (p.includes('/api/payment') || p.includes('/payment')) {
        return withOutcome('Payment request', log.status);
      }
      if (p.includes('/api/api-management') || p.includes('/api-management')) {
        return withOutcome('API management request', log.status);
      }
      return withOutcome('Request', log.status);
    }
  }
}

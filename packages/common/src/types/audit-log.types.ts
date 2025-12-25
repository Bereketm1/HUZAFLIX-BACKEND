export enum AuditActor {
  User = 'User',
  System = 'System',
}

export enum AuditEvent {
  LOGIN = 'LOGIN',
  PAYMENT = 'PAYMENT',
  API_KEY_GEN = 'API_KEY_GEN',
  SUB_UPDATE = 'SUB_UPDATE',
  API_MANAGEMENT = 'API_MANAGEMENT',
  REQUEST = 'REQUEST',
  ADMIN_ACTION = 'ADMIN_ACTION',
}

export type AuditLogMetadata = Record<string, unknown>;

export interface AuditLogPayload {
  timestamp: string;
  actor: AuditActor;
  event: AuditEvent;
  status: number;
  ipAddress?: string;
  metadata?: AuditLogMetadata;
}

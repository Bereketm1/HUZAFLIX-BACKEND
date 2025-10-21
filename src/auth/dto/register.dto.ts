export interface RegisterDto {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

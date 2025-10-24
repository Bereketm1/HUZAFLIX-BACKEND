export class ApiResponse {
  success: boolean;
  status: number;
  message: string;
  data: Record<string, any> | null;

  constructor(
    success: boolean,
    status: number,
    message: string,
    data?: Record<string, any>,
  ) {
    this.success = success;
    this.status = status;
    this.message = message;
    this.data = data ?? null;
  }
}

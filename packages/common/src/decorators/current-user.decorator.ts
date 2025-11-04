import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface UserRecord {
  id: number;
  [key: string]: unknown;
}

interface RequestWithAuth extends Request {
  user?: UserRecord | null;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserRecord | undefined, ctx: ExecutionContext): any => {
    const request: RequestWithAuth = ctx
      .switchToHttp()
      .getRequest<RequestWithAuth>();
    const user = request.user;
    if (data) return user?.[data];
    return user;
  },
);

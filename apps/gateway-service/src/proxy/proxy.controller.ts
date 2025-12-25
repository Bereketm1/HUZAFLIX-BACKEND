import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @All(['auth', 'auth/*path'])
  async auth(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxy.forward('auth', req, res);
  }

  @All(['analytics', 'analytics/*path'])
  async analytics(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxy.forward('analytics', req, res);
  }

  @All(['api-management', 'api-management/*path'])
  async apiManagement(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.proxy.forward('api-management', req, res);
  }

  @All(['payment', 'payment/*path'])
  async payment(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxy.forward('payment', req, res);
  }

  @All(['audit-log', 'audit-log/*path'])
  async auditLog(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxy.forward('audit-log', req, res);
  }
}

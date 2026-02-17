import { All, Controller, Param, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ProxyService } from 'src/proxy/service/proxy.service';

@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All(':slug')
  async proxyRoot(@Param('slug') slug: string, @Req() req: Request) {
    return await this.proxyService.proxy(slug, '', req);
  }

  @All(':slug/*path')
  async proxyPath(
    @Param('slug') slug: string,
    @Param('path') path: string,
    @Req() req: Request,
  ) {
    return await this.proxyService.proxy(slug, path, req);
  }
}

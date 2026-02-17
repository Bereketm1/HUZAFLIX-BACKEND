import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PlaygroundService } from 'src/playground/service/playground/playground.service';
import { ProxyPlaygroundRequestDto } from 'src/playground/dto/proxy-playground-request.dto';

@Controller('playground')
export class PlaygroundController {
  constructor(private readonly playgroundService: PlaygroundService) {}

  @Get(':id/endpoints')
  async getEndpoints(@Param('id') id: number) {
    return this.playgroundService.getEndpointsFromSwagger(id);
  }

  @Get(':id/responses/:endpoint')
  async getResponse(
    @Param('endpoint') endpoint: string,
    @Param('id') id: number,
  ) {
    return this.playgroundService.getEndpointResponses(id, endpoint);
  }

  @Get(':id/details/:endpoint')
  async getDetails(
    @Param('endpoint') endpoint: string,
    @Param('id') id: number,
  ) {
    return this.playgroundService.getEndpointDetails(id, endpoint);
  }

  @Post(':id/proxy')
  async proxy(
    @Param('id') id: number,
    @Body() body: ProxyPlaygroundRequestDto,
  ) {
    return this.playgroundService.proxyRequest(id, body);
  }
}

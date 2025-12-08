import { Controller, Get, Param } from '@nestjs/common';
import { PlaygroundService } from 'src/playground/service/playground/playground.service';

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
}

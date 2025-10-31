import { DynamicModule, Global, Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';

@Global()
@Module({})
export class CommonModule {
  static forRoot(options: JwtModuleOptions): DynamicModule {
    return {
      module: CommonModule,
      imports: [JwtModule.register(options)],
      exports: [JwtModule],
    };
  }
}

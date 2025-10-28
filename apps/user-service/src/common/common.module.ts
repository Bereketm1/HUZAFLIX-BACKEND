import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: (() => {
          const s = process.env.JWT_SECRET;
          if (!s)
            throw new Error(
              'JWT_SECRET is not configured. Set JWT_SECRET in your environment',
            );
          return s;
        })(),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class CommonModule {}

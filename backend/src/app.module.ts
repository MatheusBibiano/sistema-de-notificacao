import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local.development',
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

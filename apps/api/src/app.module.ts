import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CategoriesModule } from './categories/categories.module';
import { ContactMessagesModule } from './contact-messages/contact-messages.module';
import { CustomersModule } from './customers/customers.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { LinksModule } from './links/links.module';
import { MailModule } from './mail/mail.module';
import { MediaModule } from './media/media.module';
import { OrdersModule } from './orders/orders.module';
import { PagesModule } from './pages/pages.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { SettingsModule } from './settings/settings.module';
import { StatsModule } from './stats/stats.module';
import { SourcesModule } from './sources/sources.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          rootPath: config.get<string>(
            'UPLOAD_DIR',
            join(process.cwd(), 'uploads'),
          ),
          serveRoot: '/uploads',
          serveStaticOptions: {
            index: false,
            fallthrough: true,
            maxAge: '1d',
          },
        },
      ],
    }),
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    CustomersModule,
    OrdersModule,
    InquiriesModule,
    ContactMessagesModule,
    SettingsModule,
    StatsModule,
    LinksModule,
    MediaModule,
    SourcesModule,
    PagesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{

  // constructor() {
  //   super({
  //     log: [
  //       { emit: 'event', level: 'query' },
  //       { emit: 'stdout', level: 'error' },
  //     ],
  //   });

  //   // @ts-ignore — $on is valid but types need casting in some versions
  //   this.$on('query', (e: Prisma.QueryEvent) => {
  //     console.log('Query:', e.query);
  //     console.log('Params:', e.params);
  //     console.log('---');
  //   });
  // }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

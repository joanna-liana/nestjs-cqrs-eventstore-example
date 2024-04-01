import { Module, OnModuleInit } from '@nestjs/common';
import { CqrsModule, EventBus } from '@nestjs/cqrs';
import { CommandHandlers } from './commands/handlers';
import { EventHandlers } from './events/handlers';
import { Events } from './events/impl';
import { HeroesGameController } from './heroes.controller';
import { QueryHandlers } from './queries/handlers';
import { HeroRepository } from './repository/hero.repository';
import { HeroesGameSagas } from './sagas/heroes.sagas';
import { ConfigModule } from '@nestjs/config';
import EventStorePublisher from './messaging/event-store.publisher';
import EventStoreSubscriber from './messaging/event-store.subscriber';
import { EventStoreDBClient } from '@eventstore/db-client';

@Module({
  imports: [CqrsModule, ConfigModule.forRoot()],
  controllers: [HeroesGameController],
  providers: [
    HeroRepository,
    ...CommandHandlers,
    ...EventHandlers,
    ...QueryHandlers,
    {
      provide: 'EVENTS',
      useValue: Events,
    },
    {
      provide: 'EVENT_STORE',
      useValue: new EventStoreDBClient(
        { endpoint: process.env.EVENT_STORE_ENDPOINT },
        { insecure: true },
      )
    },
    HeroesGameSagas,
    EventStoreSubscriber,
    EventStorePublisher
  ],
})
export class HeroesGameModule implements OnModuleInit {
  constructor(
    private readonly eventBus$: EventBus,
    private readonly eventStoreSubscriber: EventStoreSubscriber,
    private readonly eventStorePublisher: EventStorePublisher,
  ) {}

  async onModuleInit(): Promise<any> {
    this.eventStoreSubscriber.connect();
    this.eventStoreSubscriber.bridgeEventsTo(this.eventBus$.subject$);
    this.eventBus$.publisher = this.eventStorePublisher;
  }
}

import { Module, OnModuleInit } from '@nestjs/common';
import { CqrsModule, EventBus } from '@nestjs/cqrs';
import { CommandHandlers } from './commands/handlers';
import { EventHandlers } from './events/handlers';
import { Events } from './events/impl';
import { HeroesGameController } from './heroes.controller';
import { QueryHandlers } from './queries/handlers';
import { HeroRepository } from './repository/hero.repository';
import { HeroesGameSagas } from './sagas/heroes.sagas';
import KafkaPublisher from './messaging/KafkaPublisher';
import KafkaSubscriber from './messaging/KafkaSubscriber';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
      provide: 'KAFKA_BROKER',
      useFactory: (configService: ConfigService) => {
        return configService.get('KAFKA_BROKER')
      },
      inject: [ConfigService]
    },
    HeroesGameSagas,
    KafkaPublisher,
    KafkaSubscriber
  ],
})
export class HeroesGameModule implements OnModuleInit {
  constructor(
    private readonly event$: EventBus,
    private readonly kafkaPublisher: KafkaPublisher,
    private readonly kafkaSubscriber: KafkaSubscriber,
  ) {}

  async onModuleInit(): Promise<any> {
    await this.kafkaSubscriber.connect();
    this.kafkaSubscriber.bridgeEventsTo(this.event$.subject$);

    await this.kafkaPublisher.connect();
    this.event$.publisher = this.kafkaPublisher;
  }
}

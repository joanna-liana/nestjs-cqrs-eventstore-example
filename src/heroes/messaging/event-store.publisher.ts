import { IEventPublisher } from '@nestjs/cqrs';
import { EventStoreDBClient, jsonEvent, JSONType } from '@eventstore/db-client';
import { Inject } from '@nestjs/common';

type EventStorePublishedEvent<TData extends JSONType = {}> = {
    data: TData;
    type: string;
};

class EventStorePublisher implements IEventPublisher {

  constructor(
    @Inject('EVENT_STORE')
    private readonly eventStore: EventStoreDBClient,
  ) {}

  async publish<TEvent>(event: TEvent): Promise<any> {
    const parsedEvent = jsonEvent({ type: event.constructor.name, data: event } as EventStorePublishedEvent);

    await this.eventStore.appendToStream('hero-stream', [parsedEvent]);
  }
}

export default EventStorePublisher

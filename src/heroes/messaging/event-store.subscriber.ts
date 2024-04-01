import { IEvent, IMessageSource } from '@nestjs/cqrs';
import { Subject } from 'rxjs';
import { Inject } from '@nestjs/common';
import { EventStoreDBClient } from '@eventstore/db-client';

class EventStoreSubscriber implements IMessageSource {

  private bridge: Subject<any>

  constructor(
    @Inject('EVENT_STORE')
    private readonly eventStore: EventStoreDBClient,
    @Inject('EVENTS') private readonly events: Array<any>
  ) {}

  async connect(): Promise<void> {
    const subscription = this.eventStore.subscribeToStream('hero-stream', { fromRevision: 'end' });


    subscription.on('data', ({ event }) => {
      for(const RegisteredEvent of this.events) {
        if (RegisteredEvent.name === event.type) {
          const receivedEvent = new RegisteredEvent(event.data);
          this.bridge.next(receivedEvent)
        }
      }
    })
  }

  bridgeEventsTo<T extends IEvent>(subject: Subject<T>): any {
    this.bridge = subject
  }

}

export default EventStoreSubscriber;

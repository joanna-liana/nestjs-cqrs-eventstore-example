import { IEvent, IMessageSource } from '@nestjs/cqrs';
import { Subject } from 'rxjs';
import { Consumer, Kafka } from 'kafkajs';
import { Inject } from '@nestjs/common';

class KafkaSubscriber implements IMessageSource {

  private readonly kafkaConsumer: Consumer
  private bridge: Subject<any>
  private readonly events: Array<any>;

  constructor(@Inject('KAFKA_BROKER') broker: string,
              @Inject('EVENTS') events: Array<any>) {
    const kafka = new Kafka({
      clientId: 'my-app',
      brokers: [broker]
    })

    this.events = events;
    this.kafkaConsumer = kafka.consumer({groupId: 'test-group'});
  }

  async connect(): Promise<void> {
    await this.kafkaConsumer.connect();
    for(const event of this.events) {
      await this.kafkaConsumer.subscribe({ topic: event.name, fromBeginning: false })
    }

    await this.kafkaConsumer.run({
      eachMessage: async ({topic, partition, message}) => {
        if(this.bridge) {
          for(const event of this.events) {
            if(event.name === topic) {
              const parsedJson = JSON.parse(message.value.toString());
              const receivedEvent = new event(parsedJson)
              this.bridge.next(receivedEvent)
            }
          }
        }
      }
    })
  }

  bridgeEventsTo<T extends IEvent>(subject: Subject<T>): any {
    this.bridge = subject
  }

}

export default KafkaSubscriber;

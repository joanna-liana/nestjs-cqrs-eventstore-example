import { IEventPublisher } from '@nestjs/cqrs';
import { Kafka, Producer } from 'kafkajs';
import { Inject } from '@nestjs/common';

class KafkaPublisher implements IEventPublisher {

  private readonly kafkaProducer: Producer

  constructor(@Inject('KAFKA_BROKER') broker: string) {
    const kafka = new Kafka({
      clientId: 'my-app',
      brokers: [broker]
    })

    this.kafkaProducer = kafka.producer();
  }

  async connect(): Promise<void> {
    await this.kafkaProducer.connect();
  }

  publish<T>(event: T): any {
    this.kafkaProducer.send({
      topic: event.constructor.name,
      messages: [
        { value: JSON.stringify(event) }
      ]
    })
  }
}

export default KafkaPublisher

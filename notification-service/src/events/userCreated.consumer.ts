import { ConsumerConfig, AckPolicy, DeliverPolicy, JsMsg } from 'nats';
import { natsClient, NatsClient } from './nats.client';
import { notificationService, NotificationService, UserCreatedEvent } from '../services/notification.service';
import { config } from '../config/index';

export class UserCreatedConsumer {
  private isRunning = false;

  constructor(
    private client: NatsClient = natsClient,
    private notifService: NotificationService = notificationService
  ) {}

  async start(): Promise<void> {
    if (!this.client.js) {
      throw new Error('[Notification Consumer] JetStream client is not initialized');
    }

    const stream = 'USERS';
    const consumerName = 'notification-durable-consumer';
    const subject = 'user.created';

    const opts: Partial<ConsumerConfig> = {
      durable_name: consumerName,
      ack_policy: AckPolicy.Explicit,
      deliver_policy: DeliverPolicy.All,
      filter_subject: subject,
      max_deliver: config.maxRetries + 1,
    };

    console.log(`[Notification Consumer] Subscribing to stream "${stream}" with durable consumer "${consumerName}"...`);

    let consumer;
    try {
      consumer = await this.client.js.consumers.get(stream, consumerName);
    } catch {
      console.log(`[Notification Consumer] Durable consumer "${consumerName}" not found. Creating...`);
      await this.client.jsm!.consumers.add(stream, opts);
      consumer = await this.client.js.consumers.get(stream, consumerName);
    }

    const messages = await consumer.consume();
    this.isRunning = true;

    (async () => {
      for await (const msg of messages) {
        if (!this.isRunning) break;
        await this.handleMessage(msg);
      }
    })().catch((err) => {
      console.error('[Notification Consumer] Consumer loop error:', err);
    });

    console.log(`[Notification Consumer] Active & listening on "${subject}"`);
  }

  private async handleMessage(msg: JsMsg): Promise<void> {
    const rawData = this.client.sc.decode(msg.data);
    const redeliveryCount = msg.info.redeliveryCount;
    let event: UserCreatedEvent;

    try {
      event = JSON.parse(rawData);
    } catch (parseError) {
      console.error('[Notification Consumer] Malformed JSON payload:', rawData);
      // Immediately move unparseable payload to DLQ
      await this.client.publishToDLQ(msg.subject, rawData, 'Malformed JSON payload');
      msg.ack();
      return;
    }

    console.log(
      `[Notification Consumer] Received message [Seq: ${msg.seq}, Redelivery: ${redeliveryCount}/${config.maxRetries}] for User: ${event.email}`
    );

    try {
      await this.notifService.sendWelcomeNotification(event);
      // Explicitly acknowledge successful processing
      msg.ack();
      console.log(`[Notification Consumer] Message [Seq: ${msg.seq}] ACKNOWLEDGED.`);
    } catch (error: any) {
      console.error(
        `[Notification Consumer] Processing failed for User: ${event.email} (Attempt ${redeliveryCount + 1}):`,
        error.message
      );

      if (redeliveryCount >= config.maxRetries) {
        console.warn(
          `[Notification Consumer] Max retries (${config.maxRetries}) reached for message [Seq: ${msg.seq}]. Routing to DLQ...`
        );
        await this.client.publishToDLQ(msg.subject, event, error.message);
        // Acknowledge message to remove it from main durable stream after DLQ routing
        msg.ack();
      } else {
        console.log(`[Notification Consumer] NACKING message [Seq: ${msg.seq}] for retry...`);
        // Negative acknowledgment tells NATS to redeliver
        msg.nak();
      }
    }
  }

  stop(): void {
    this.isRunning = false;
    console.log('[Notification Consumer] Consumer loop stopped.');
  }
}

export const userCreatedConsumer = new UserCreatedConsumer();

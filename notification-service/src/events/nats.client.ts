import { connect, NatsConnection, JetStreamClient, JetStreamManager, StringCodec } from 'nats';
import { config } from '../config/index';

export class NatsClient {
  public nc?: NatsConnection;
  public js?: JetStreamClient;
  public jsm?: JetStreamManager;
  public sc = StringCodec();

  async connect(): Promise<void> {
    try {
      console.log(`[Notification Service NATS] Connecting to ${config.natsUrl}...`);
      this.nc = await connect({ servers: config.natsUrl });
      this.js = this.nc.jetstream();
      this.jsm = await this.nc.jetstreamManager();

      await this.ensureStreams();
      console.log('[Notification Service NATS] Connected & JetStream streams validated.');
    } catch (error) {
      console.error('[Notification Service NATS] Connection failed:', error);
      throw error;
    }
  }

  private async ensureStreams(): Promise<void> {
    if (!this.jsm) return;

    // Ensure main stream
    try {
      await this.jsm.streams.info('USERS');
    } catch {
      await this.jsm.streams.add({
        name: 'USERS',
        subjects: ['user.created'],
      });
    }

    // Ensure DLQ stream
    try {
      await this.jsm.streams.info('USERS_DLQ');
    } catch {
      await this.jsm.streams.add({
        name: 'USERS_DLQ',
        subjects: ['user.created.dlq'],
      });
    }
  }

  async publishToDLQ(subject: string, payload: any, errorReason: string): Promise<void> {
    if (!this.js) return;

    const dlqPayload = {
      originalSubject: subject,
      originalPayload: payload,
      failedAt: new Date().toISOString(),
      reason: errorReason,
    };

    const dlqSubject = `${subject}.dlq`;
    const ack = await this.js.publish(dlqSubject, this.sc.encode(JSON.stringify(dlqPayload)));
    console.warn(
      `[Notification Service DLQ] Message routed to DLQ subject "${dlqSubject}", seq: ${ack.seq}. Reason: ${errorReason}`
    );
  }

  async disconnect(): Promise<void> {
    if (this.nc) {
      await this.nc.drain();
      await this.nc.close();
      console.log('[Notification Service NATS] Connection safely closed.');
    }
  }
}

export const natsClient = new NatsClient();

import { connect, NatsConnection, JetStreamClient, JetStreamManager, StringCodec } from 'nats';
import { config } from '../config/index';

export interface UserCreatedEventPayload {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
}

export class NatsPublisher {
  private nc?: NatsConnection;
  private js?: JetStreamClient;
  private jsm?: JetStreamManager;
  private sc = StringCodec();

  async connect(): Promise<void> {
    try {
      console.log(`[User Service NATS] Connecting to NATS server at ${config.natsUrl}...`);
      this.nc = await connect({ servers: config.natsUrl });
      this.js = this.nc.jetstream();
      this.jsm = await this.nc.jetstreamManager();

      await this.ensureStream();
      console.log('[User Service NATS] Connected and JetStream Stream "USERS" verified.');
    } catch (error) {
      console.error('[User Service NATS] Connection failed:', error);
      throw error;
    }
  }

  private async ensureStream(): Promise<void> {
    if (!this.jsm) return;
    const streamName = 'USERS';
    const subjects = ['user.created', 'user.created.dlq'];

    try {
      await this.jsm.streams.info(streamName);
      console.log(`[User Service NATS] Stream "${streamName}" already exists.`);
    } catch (err: any) {
      // Stream does not exist, create it
      console.log(`[User Service NATS] Stream "${streamName}" not found. Creating stream...`);
      await this.jsm.streams.add({
        name: streamName,
        subjects: subjects,
      });
      console.log(`[User Service NATS] Stream "${streamName}" created successfully.`);
    }
  }

  async publishUserCreated(event: UserCreatedEventPayload): Promise<void> {
    if (!this.js) {
      throw new Error('[User Service NATS] JetStream client is not initialized');
    }

    const subject = 'user.created';
    const payload = JSON.stringify(event);

    const pubAck = await this.js.publish(subject, this.sc.encode(payload));
    console.log(
      `[User Service NATS] Event "${subject}" published successfully to stream "${pubAck.stream}", seq: ${pubAck.seq}`
    );
  }

  async disconnect(): Promise<void> {
    if (this.nc) {
      await this.nc.drain();
      await this.nc.close();
      console.log('[User Service NATS] Connection safely closed.');
    }
  }
}

export const natsPublisher = new NatsPublisher();

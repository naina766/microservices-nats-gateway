export interface UserCreatedEvent {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  simulateFailure?: boolean; // Optional flag for testing DLQ pattern
}

export class NotificationService {
  async sendWelcomeNotification(event: UserCreatedEvent): Promise<void> {
    console.log(`[Notification Service] 📧 Processing notification for user: ${event.name} (${event.email})`);

    // Simulated failure check for testing DLQ pipeline
    if (event.simulateFailure || event.email.endsWith('@dlq-test.com')) {
      throw new Error(`Simulated notification delivery failure for ${event.email}`);
    }

    // Simulate async email/SMS delivery latency
    await new Promise((resolve) => setTimeout(resolve, 300));

    console.log(`[Notification Service] ✅ Welcome email & SMS successfully delivered to ${event.email}`);
  }
}

export const notificationService = new NotificationService();

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository, UserRepository } from '../repositories/user.repository';
import { natsPublisher, NatsPublisher } from '../events/nats.publisher';
import { RegisterUserDto, LoginUserDto } from '../validators/user.validator';
import { config } from '../config/index';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export class UserService {
  constructor(
    private userRepo: UserRepository = userRepository,
    private publisher: NatsPublisher = natsPublisher
  ) {}

  async registerUser(dto: RegisterUserDto): Promise<{ user: UserResponse; token: string }> {
    const existingUser = await this.userRepo.findByEmail(dto.email);
    if (existingUser) {
      const error: any = new Error('User with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const newUser = await this.userRepo.createUser({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
    });

    // Asynchronously publish user.created event to NATS JetStream
    try {
      await this.publisher.publishUserCreated({
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.createdAt.toISOString(),
      });
    } catch (natsErr) {
      console.error('[User Service] Failed to publish user.created event to NATS JetStream:', natsErr);
      // DB user is persisted. In production systems, an outbox pattern or retry queue is recommended.
    }

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.createdAt,
      },
      token,
    };
  }

  async loginUser(dto: LoginUserDto): Promise<{ user: UserResponse; token: string }> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async getUserById(id: string): Promise<UserResponse> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}

export const userService = new UserService();

import { PrismaClient, User } from '@prisma/client';

export const prisma = new PrismaClient();

export class UserRepository {
  async createUser(data: { email: string; password: string; name: string }): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }
}

export const userRepository = new UserRepository();

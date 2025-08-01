// database.service.ts
import { neon } from '@neondatabase/serverless';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro';
  usage_current_month: number;
  usage_limit: number;
  storage_used: bigint; //
  storage_limit: bigint; // renamed from storage_limit
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDto {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

interface PlanLimits {
  usage_limit: number; // transfers per month
  storage_limit: bigint; // max bytes per transfer
}

const FREE_PLAN_LIMITS: PlanLimits = {
  usage_limit: 8, // 8 transfers per month
  storage_limit: 5n * 1024n * 1024n * 1024n, // 5GB transfer per month
};

const DEFAULT_PRO_LIMITS: PlanLimits = {
  usage_limit: 30, // 30 transfers per month
  storage_limit: 10n * 1024n * 1024n * 1024n, // 10GB per transfer
};

@Injectable()
export class UsersService {
  private readonly sql: ReturnType<typeof neon>;

  constructor(private configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }
    this.sql = neon(databaseUrl);
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    const plan = 'free';
    const usage_current_month = 0;
    const usage_limit = FREE_PLAN_LIMITS.usage_limit;
    const storage_used = 0n;
    const storage_limit = FREE_PLAN_LIMITS.storage_limit;
    const created_at = new Date();
    const updated_at = new Date();

    const result = (await this.sql`
      INSERT INTO users (
        id, email, full_name, avatar_url, plan,
        usage_current_month, usage_limit,
        storage_used, storage_limit, created_at, updated_at
      ) VALUES (
        ${userData.id},
        ${userData.email},
        ${userData.full_name ?? null},
        ${userData.avatar_url ?? null},
        ${plan},
        ${usage_current_month},
        ${usage_limit},
        ${storage_used},
        ${storage_limit},
        ${created_at},
        ${updated_at}
      )
      RETURNING *
    `) as User[];

    if (!result[0]) {
      throw new InternalServerErrorException('Failed to create user');
    }

    return result[0];
  }

  async getUser(id: string): Promise<User> {
    const result = (await this.sql`
      SELECT * FROM users WHERE id = ${id}
    `) as User[];

    if (!result[0]) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return result[0];
  }

  async updateUserUsage(
    id: string,
    additionalUsage: number,
    additionalStorage: bigint,
  ): Promise<User> {
    const result = (await this.sql`
      UPDATE users
      SET 
        usage_current_month = usage_current_month + ${additionalUsage},
        storage_used = storage_used + ${additionalStorage},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `) as User[];

    if (!result[0]) {
      throw new InternalServerErrorException('User not found');
    }

    return result[0];
  }

  async resetMonthlyUsage(): Promise<void> {
    await this.sql`
      UPDATE users
      SET usage_current_month = 0
      WHERE usage_current_month > 0
    `;
  }

  async upgradeUserToPro(
    userId: string,
    limits: Partial<PlanLimits> = DEFAULT_PRO_LIMITS,
  ): Promise<User> {
    const result = (await this.sql`
      UPDATE users
      SET 
        plan = 'pro',
        usage_limit = ${limits.usage_limit ?? DEFAULT_PRO_LIMITS.usage_limit},
        storage_limit = ${limits.storage_limit ?? DEFAULT_PRO_LIMITS.storage_limit},
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING *
    `) as User[];

    if (!result[0]) {
      throw new InternalServerErrorException('User not found');
    }

    return result[0];
  }

  async downgradeUserToFree(userId: string): Promise<User> {
    const result = (await this.sql`
      UPDATE users
      SET 
        plan = 'free',
        usage_limit = ${FREE_PLAN_LIMITS.usage_limit},
        storage_limit = ${FREE_PLAN_LIMITS.storage_limit},
        updated_at = NOW()
      WHERE id = ${userId}
        AND storage_used <= ${FREE_PLAN_LIMITS.storage_limit}
        AND usage_current_month <= ${FREE_PLAN_LIMITS.usage_limit}
      RETURNING *
    `) as User[];

    if (!result[0]) {
      throw new InternalServerErrorException(
        'User not found or exceeds free plan limits',
      );
    }

    return result[0];
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  NotFoundException,
  UnauthorizedException,
  Req,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService, CreateUserDto } from './users.service';
import { createClerkClient, ClerkClient } from '@clerk/backend';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Injectable()
@Controller('users')
export class UsersController {
  private readonly clerkClient: ClerkClient;

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) {
      throw new Error('CLERK_SECRET_KEY is not defined');
    }
    this.clerkClient = createClerkClient({ secretKey });
  }

  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;

    const user = await this.usersService.getUser(userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.getUser(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Post()
  async create(@Body() { id }: { id: string }) {
    // Get user data from Clerk
    const clerkUser = await this.clerkClient.users.getUser(id);
    console.log('🚀 ~ UsersController ~ create ~ clerkUser:', clerkUser);
    if (!clerkUser) {
      throw new NotFoundException('User not found in Clerk');
    }

    try {
      // Create user with data from Clerk
      const createUserDto: CreateUserDto = {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        full_name:
          clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
            : null,
        avatar_url: clerkUser.imageUrl,
      };

      // Validate required fields
      if (!createUserDto.email) {
        throw new UnauthorizedException('User must have an email address');
      }

      return this.usersService.createUser(createUserDto);
    } catch (error) {
      // If database creation fails, delete the user from Clerk
      console.error('Failed to create user in database:', error);
      try {
        await this.clerkClient.users.deleteUser(id);
        console.log('Cleaned up Clerk user after database failure');
      } catch (cleanupError) {
        console.error('Failed to cleanup Clerk user:', cleanupError);
      }
      throw error; // Re-throw the original error
    }
  }

  @Patch(':id/upgrade')
  async upgradeToPro(@Param('id') id: string) {
    return this.usersService.upgradeUserToPro(id);
  }

  @Patch(':id/downgrade')
  async downgradeToFree(@Param('id') id: string) {
    return this.usersService.downgradeUserToFree(id);
  }
}

import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { Request } from 'express';
import { ClerkClient, verifyToken } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  constructor(
    @Inject('ClerkClient') private clerkClient: ClerkClient,
    private configService: ConfigService,
  ) {
    super();
  }

  async validate(req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await verifyToken(token, {
        secretKey: this.configService.get('CLERK_SECRET_KEY'),
      });

      const user = await this.clerkClient.users.getUser(payload.sub);

      return user; // This gets attached to req.user
    } catch (err) {
      console.error('Clerk token verification failed:', err);
      throw new UnauthorizedException('Invalid Clerk token');
    }
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { CurrentUserPayload } from './decorators/current-user.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtSecret: string;

  constructor(private configService: ConfigService) {
    this.jwtSecret =
      this.configService.get<string>('SUPABASE_JWT_SECRET') || '';
    if (!this.jwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET environment variable is required');
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload = jwt.verify(token, this.jwtSecret) as jwt.JwtPayload;
      const userId = payload.sub || (payload.user_id as string | undefined);
      const userEmail = payload.email as string | undefined;

      if (!userId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const user: CurrentUserPayload = {
        id: userId,
        email: userEmail,
      };

      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

import { Injectable } from '@nestjs/common';

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

@Injectable()
export class AppService {
  getHealth(): HealthCheckResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}

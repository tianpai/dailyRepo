import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix for all routes
  app.setGlobalPrefix('api/v2');

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://daily-repo.vercel.app',
      'https://dailyrepo.tianpai.io',
      'https://www.dailyrepo.tianpai.io',
      'https://dailyrepo.up.railway.app',
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Register global interceptor for response wrapping
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Register global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';
import { ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`,
        );
        throw new BadRequestException(messages.join(', '));
      }
      throw new BadRequestException('Validation failed');
    }
  }
}

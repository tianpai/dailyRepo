export class JobInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JobInputError';
  }
}

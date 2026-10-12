import { parseArgs } from 'node:util';
import { parseDate, weeklyPeriod } from './periods';
import { JobInputError } from './errors';

export const HELP = `Usage:
  daily [--date YYYY-MM-DD] [--force]
  weekly [--week-of YYYY-MM-DD] [--force]
  schedule

weekly defaults to the previous completed Monday–Sunday UTC week.
Existing results are preserved unless --force is supplied.
ENV_FILE can select a local environment file (relative to the jobs directory).
`;

export function parseCommand(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      date: { type: 'string' },
      'week-of': { type: 'string' },
      force: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help || !positionals.length) return { command: 'help' as const };
  const [command] = positionals;
  if (
    positionals.length !== 1 ||
    !['daily', 'weekly', 'schedule'].includes(command)
  ) {
    throw new JobInputError(
      'Choose daily, weekly, or schedule. Use --help for usage.',
    );
  }
  if (values.date && command !== 'daily')
    throw new JobInputError('--date is only valid for daily');
  if (values['week-of'] && command !== 'weekly')
    throw new JobInputError('--week-of is only valid for weekly');
  if (command === 'schedule' && values.force)
    throw new JobInputError('--force is only valid for one-off jobs');
  if (values.date) parseDate(values.date);
  if (values['week-of']) weeklyPeriod(values['week-of']);
  return {
    command,
    date: values.date,
    weekOf: values['week-of'],
    force: values.force,
  };
}

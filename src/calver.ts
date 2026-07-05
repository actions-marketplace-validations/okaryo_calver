export type CalverTag = {
  version: string;
  date: number;
  sequence: number;
};

export type CalculateNextVersionOptions = {
  prefix: string;
  majorVersion: string;
  timezone: string;
  tags: string[];
  now?: Date;
};

export type CalculateNextVersionResult = {
  version: string;
  date: string;
  sequence: string;
  previousVersion: string;
  hasPreviousVersion: string;
};

export function validateMajorVersion(majorVersion: string): void {
  if (majorVersion.length === 0) {
    throw new Error('major-version must not be empty.');
  }

  if (!/^\d+$/.test(majorVersion)) {
    throw new Error('major-version must be a non-negative integer.');
  }
}

export function resolveDate(timezone: string, now = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const parts = formatter.formatToParts(now);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    if (!year || !month || !day) {
      throw new Error('date parts could not be resolved.');
    }

    return `${year}${month}${day}`;
  } catch (error) {
    if (error instanceof RangeError) {
      throw new Error(`timezone must be a valid IANA timezone name: ${timezone}`);
    }

    throw error;
  }
}

export function parseMatchingTags(tags: string[], prefix: string, majorVersion: string): CalverTag[] {
  const pattern = new RegExp(`^${escapeRegExp(prefix)}${escapeRegExp(majorVersion)}\\.(\\d{8})\\.(\\d+)$`);

  return tags.flatMap((tag) => {
    const match = pattern.exec(tag);
    if (!match) {
      return [];
    }

    return [
      {
        version: tag,
        date: Number(match[1]),
        sequence: Number(match[2])
      }
    ];
  });
}

export function calculateNextVersion(options: CalculateNextVersionOptions): CalculateNextVersionResult {
  validateMajorVersion(options.majorVersion);

  const date = resolveDate(options.timezone, options.now);
  const matchingTags = parseMatchingTags(options.tags, options.prefix, options.majorVersion);
  const currentDate = Number(date);
  const currentDateTags = matchingTags.filter((tag) => tag.date === currentDate);
  const currentDateSequences = currentDateTags.map((tag) => tag.sequence);
  const sequence = currentDateSequences.length === 0 ? 0 : Math.max(...currentDateSequences) + 1;
  const previousVersion = findLatestVersion(currentDateTags)?.version ?? '';

  return {
    version: `${options.prefix}${options.majorVersion}.${date}.${sequence}`,
    date,
    sequence: String(sequence),
    previousVersion,
    hasPreviousVersion: previousVersion.length > 0 ? 'true' : 'false'
  };
}

function findLatestVersion(tags: CalverTag[]): CalverTag | undefined {
  return [...tags].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date - a.date;
    }

    return b.sequence - a.sequence;
  })[0];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

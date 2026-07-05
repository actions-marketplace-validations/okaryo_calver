import { calculateNextVersion, parseMatchingTags, resolveDate, validateMajorVersion } from '../src/calver.js';

const now = new Date('2026-07-10T00:30:00.000Z');

describe('calculateNextVersion', () => {
  it('returns sequence 0 for the first release of the day', () => {
    const result = calculateNextVersion({
      prefix: 'v',
      majorVersion: '1',
      timezone: 'UTC',
      tags: [],
      now
    });

    expect(result).toMatchObject({
      version: 'v1.20260710.0',
      date: '20260710',
      sequence: '0',
      previousVersion: '',
      hasPreviousVersion: 'false'
    });
  });

  it('returns sequence 1 for the second release of the day', () => {
    const result = calculateNextVersion({
      prefix: 'v',
      majorVersion: '1',
      timezone: 'UTC',
      tags: ['v1.20260710.0'],
      now
    });

    expect(result.sequence).toBe('1');
    expect(result.version).toBe('v1.20260710.1');
    expect(result.previousVersion).toBe('v1.20260710.0');
  });

  it('selects the highest sequence numerically', () => {
    const result = calculateNextVersion({
      prefix: 'v',
      majorVersion: '1',
      timezone: 'UTC',
      tags: ['v1.20260710.2', 'v1.20260710.10', 'v1.20260710.1'],
      now
    });

    expect(result.sequence).toBe('11');
    expect(result.version).toBe('v1.20260710.11');
  });

  it('ignores different major versions', () => {
    const result = calculateNextVersion({
      prefix: 'v',
      majorVersion: '1',
      timezone: 'UTC',
      tags: ['v2.20260710.4'],
      now
    });

    expect(result.version).toBe('v1.20260710.0');
    expect(result.previousVersion).toBe('');
  });

  it('ignores different prefixes', () => {
    const result = calculateNextVersion({
      prefix: 'v',
      majorVersion: '1',
      timezone: 'UTC',
      tags: ['release-1.20260710.4'],
      now
    });

    expect(result.version).toBe('v1.20260710.0');
    expect(result.previousVersion).toBe('');
  });

  it('ignores invalid tags', () => {
    const result = calculateNextVersion({
      prefix: 'v',
      majorVersion: '1',
      timezone: 'UTC',
      tags: ['v1.20260710', 'v1.20260710.beta', 'v1.20260710.0-extra', 'v1.2026071.0'],
      now
    });

    expect(result.version).toBe('v1.20260710.0');
    expect(result.previousVersion).toBe('');
  });

  it('does not select previous version from previous dates', () => {
    const result = calculateNextVersion({
      prefix: 'v',
      majorVersion: '1',
      timezone: 'UTC',
      tags: ['v1.20260708.0', 'v1.20260709.0', 'v1.20260709.1'],
      now
    });

    expect(result.previousVersion).toBe('');
    expect(result.hasPreviousVersion).toBe('false');
  });

  it('sorts previous versions numerically by sequence for the current date', () => {
    const result = calculateNextVersion({
      prefix: 'v',
      majorVersion: '1',
      timezone: 'UTC',
      tags: ['v1.20260709.10', 'v1.20260710.2', 'v1.20260710.11'],
      now
    });

    expect(result.previousVersion).toBe('v1.20260710.11');
    expect(result.sequence).toBe('12');
  });

  it('supports timezone-specific date resolution', () => {
    const result = calculateNextVersion({
      prefix: 'v',
      majorVersion: '1',
      timezone: 'America/Los_Angeles',
      tags: [],
      now
    });

    expect(result.date).toBe('20260709');
    expect(result.version).toBe('v1.20260709.0');
  });

  it('supports an empty prefix', () => {
    const result = calculateNextVersion({
      prefix: '',
      majorVersion: '1',
      timezone: 'UTC',
      tags: ['1.20260710.0'],
      now
    });

    expect(result.version).toBe('1.20260710.1');
    expect(result.previousVersion).toBe('1.20260710.0');
  });
});

describe('resolveDate', () => {
  it('fails for invalid timezone values', () => {
    expect(() => resolveDate('Not/A_Timezone', now)).toThrow('timezone must be a valid IANA timezone name');
  });
});

describe('validateMajorVersion', () => {
  it.each(['', 'v1', '1.0', '-1'])('fails for invalid major version %j', (majorVersion) => {
    expect(() => validateMajorVersion(majorVersion)).toThrow();
  });
});

describe('parseMatchingTags', () => {
  it('escapes prefixes when matching tags', () => {
    expect(parseMatchingTags(['release+1.20260710.0'], 'release+', '1')).toHaveLength(1);
  });
});

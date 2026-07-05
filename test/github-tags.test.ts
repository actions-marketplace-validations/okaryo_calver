import { vi } from 'vitest';
import { listRepositoryTags } from '../src/github-tags.js';

const mocks = vi.hoisted(() => {
  const listMatchingRefs = vi.fn();
  const getOctokit = vi.fn(() => ({
    rest: {
      git: {
        listMatchingRefs
      }
    }
  }));

  return { getOctokit, listMatchingRefs };
});

vi.mock('@actions/github', () => ({
  getOctokit: mocks.getOctokit
}));

const originalRepository = process.env.GITHUB_REPOSITORY;

afterEach(() => {
  vi.clearAllMocks();
  process.env.GITHUB_REPOSITORY = originalRepository;
});

describe('listRepositoryTags', () => {
  it('loads current date repository tags with the actions GitHub client', async () => {
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    mocks.listMatchingRefs.mockResolvedValue({
      data: [{ ref: 'refs/tags/v1.20260705.0' }, { ref: 'refs/tags/v1.20260705.1' }]
    });

    await expect(
      listRepositoryTags('github-token', {
        prefix: 'v',
        majorVersion: '1',
        date: '20260705'
      })
    ).resolves.toEqual(['v1.20260705.0', 'v1.20260705.1']);
    expect(mocks.getOctokit).toHaveBeenCalledWith('github-token');
    expect(mocks.listMatchingRefs).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      ref: 'tags/v1.20260705.'
    });
  });

  it('fails when GITHUB_REPOSITORY is missing', async () => {
    delete process.env.GITHUB_REPOSITORY;

    await expect(
      listRepositoryTags('github-token', {
        prefix: 'v',
        majorVersion: '1',
        date: '20260705'
      })
    ).rejects.toThrow('GITHUB_REPOSITORY environment variable is required.');
    expect(mocks.getOctokit).not.toHaveBeenCalled();
  });

  it('wraps GitHub API errors', async () => {
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    mocks.listMatchingRefs.mockRejectedValue(new Error('not found'));

    await expect(
      listRepositoryTags('github-token', {
        prefix: 'v',
        majorVersion: '1',
        date: '20260705'
      })
    ).rejects.toThrow('Failed to load repository tags from GitHub API: not found');
  });
});

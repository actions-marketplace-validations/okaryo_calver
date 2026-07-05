import * as github from '@actions/github';

type ListRepositoryTagsOptions = {
  prefix: string;
  majorVersion: string;
  date: string;
};

export async function listRepositoryTags(token: string, options: ListRepositoryTagsOptions): Promise<string[]> {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    throw new Error('GITHUB_REPOSITORY environment variable is required.');
  }

  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    throw new Error('GITHUB_REPOSITORY environment variable must use the owner/repo format.');
  }

  try {
    const octokit = github.getOctokit(token);
    const response = await octokit.rest.git.listMatchingRefs({
      owner,
      repo,
      ref: `tags/${options.prefix}${options.majorVersion}.${options.date}.`
    });

    return response.data.flatMap((tag) => stripTagPrefix(tag.ref));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load repository tags from GitHub API: ${message}`);
  }
}

function stripTagPrefix(ref: string): string[] {
  const prefix = 'refs/tags/';

  if (!ref.startsWith(prefix)) {
    return [];
  }

  return [ref.slice(prefix.length)];
}

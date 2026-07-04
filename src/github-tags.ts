import { request } from 'node:https';

export async function listRepositoryTags(token: string): Promise<string[]> {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    throw new Error('GITHUB_REPOSITORY environment variable is required.');
  }

  try {
    const tags: string[] = [];
    let path: string | undefined = `/repos/${repository}/tags?per_page=100`;

    while (path) {
      const response = await githubApiRequest(path, token);
      const body = JSON.parse(response.body) as unknown;

      if (!Array.isArray(body)) {
        throw new Error('GitHub API returned an unexpected tag response.');
      }

      for (const tag of body) {
        if (isTagResponse(tag)) {
          tags.push(tag.name);
        }
      }

      path = findNextPath(response.headers.link);
    }

    return tags;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load repository tags from GitHub API: ${message}`);
  }
}

type GitHubApiResponse = {
  body: string;
  headers: Record<string, string | undefined>;
};

type TagResponse = {
  name: string;
};

function githubApiRequest(path: string, token: string): Promise<GitHubApiResponse> {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'api.github.com',
      path,
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'okaryo-calver-action',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    };

    const req = request(requestOptions, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        const statusCode = res.statusCode ?? 0;

        if (statusCode < 200 || statusCode >= 300) {
          reject(new Error(`GitHub API returned HTTP ${statusCode}: ${body}`));
          return;
        }

        resolve({
          body,
          headers: {
            link: normalizeHeaderValue(res.headers.link)
          }
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function normalizeHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value.join(',');
  }

  return value;
}

function findNextPath(linkHeader: string | undefined): string | undefined {
  if (!linkHeader) {
    return undefined;
  }

  for (const link of linkHeader.split(',')) {
    const match = /<([^>]+)>;\s*rel="next"/.exec(link.trim());
    if (!match) {
      continue;
    }

    return new URL(match[1]).pathname + new URL(match[1]).search;
  }

  return undefined;
}

function isTagResponse(value: unknown): value is TagResponse {
  return typeof value === 'object' && value !== null && 'name' in value && typeof value.name === 'string';
}

import * as core from '@actions/core';
import { calculateNextVersion } from './calver.js';
import { listRepositoryTags } from './github-tags.js';

async function run(): Promise<void> {
  try {
    const prefix = core.getInput('prefix');
    const majorVersion = core.getInput('major-version');
    const timezone = core.getInput('timezone');
    const githubToken = core.getInput('github-token', { required: true });

    const tags = await listRepositoryTags(githubToken);
    const result = calculateNextVersion({
      prefix,
      majorVersion,
      timezone,
      tags
    });

    core.setOutput('version', result.version);
    core.setOutput('date', result.date);
    core.setOutput('sequence', result.sequence);
    core.setOutput('previous-version', result.previousVersion);
    core.setOutput('has-previous-version', result.hasPreviousVersion);
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

await run();

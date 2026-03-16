#!/usr/bin/env node

/**
 * Parses kj review JSON output and posts it as a GitHub PR review
 * using the BecarIA GitHub App token.
 *
 * Usage:
 *   node post-review.js <review-output-file> <repo> <pr-number> <token>
 *
 * The review output file should contain JSON with the karajan review schema:
 *   { approved, blocking_issues[], non_blocking_suggestions[], summary, confidence }
 */

import { readFileSync } from 'node:fs';

const [, , outputFile, repo, prNumber, token] = process.argv;

if (!outputFile || !repo || !prNumber || !token) {
  console.error(
    'Usage: post-review.js <review-output-file> <repo> <pr-number> <token>'
  );
  process.exit(1);
}

/**
 * Extracts the last valid JSON object from kj review output.
 * The output may contain log lines before/after the JSON.
 */
function extractReviewJson(raw) {
  const lines = raw.trim().split('\n');

  // Try the whole content first
  try {
    return JSON.parse(raw.trim());
  } catch {
    // noop
  }

  // Try each line from the end
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(lines[i]);
      if (parsed && typeof parsed.approved === 'boolean') {
        return parsed;
      }
    } catch {
      // noop
    }
  }

  // Try to find a JSON block in the content
  const start = raw.lastIndexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const candidate = raw.slice(start, end + 1);
      const parsed = JSON.parse(candidate);
      if (typeof parsed.approved === 'boolean') {
        return parsed;
      }
    } catch {
      // noop
    }
  }

  return null;
}

/**
 * Formats the review result into a markdown body for the PR review.
 */
function formatReviewBody(review) {
  const lines = [];

  if (review.summary) {
    lines.push(`## Summary`);
    lines.push(review.summary);
    lines.push('');
  }

  lines.push(
    `**Decision:** ${review.approved ? 'APPROVED' : 'CHANGES REQUESTED'}`
  );
  lines.push(
    `**Confidence:** ${Math.round((review.confidence || 0) * 100)}%`
  );
  lines.push('');

  if (review.blocking_issues?.length > 0) {
    lines.push('## Blocking Issues');
    for (const issue of review.blocking_issues) {
      if (typeof issue === 'string') {
        lines.push(`- ${issue}`);
      } else {
        const id = issue.id ? `**${issue.id}**` : '';
        const severity = issue.severity
          ? `[${issue.severity.toUpperCase()}]`
          : '';
        const desc = issue.description || issue.message || JSON.stringify(issue);
        const file = issue.file ? ` (_${issue.file}_)` : '';
        lines.push(`- ${severity} ${id} ${desc}${file}`);
      }
    }
    lines.push('');
  }

  if (review.non_blocking_suggestions?.length > 0) {
    lines.push('## Suggestions');
    for (const sug of review.non_blocking_suggestions) {
      if (typeof sug === 'string') {
        lines.push(`- ${sug}`);
      } else {
        const id = sug.id ? `**${sug.id}**` : '';
        const desc = sug.description || sug.message || JSON.stringify(sug);
        const file = sug.file ? ` (_${sug.file}_)` : '';
        lines.push(`- ${id} ${desc}${file}`);
      }
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('_**[Reviewer]** via BecarIA_');

  return lines.join('\n');
}

async function postReview(reviewBody, event) {
  const url = `https://api.github.com/repos/${repo}/pulls/${prNumber}/reviews`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      body: reviewBody,
      event,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  console.log(`Review posted: ${data.html_url}`);
  return data;
}

// Main
const raw = readFileSync(outputFile, 'utf-8');
const review = extractReviewJson(raw);

if (!review) {
  console.error('Could not parse review JSON from kj output');
  console.error('Raw output (first 500 chars):', raw.slice(0, 500));

  // Post a comment instead of failing silently
  await postReview(
    '## Review Error\n\nBecarIA could not parse the reviewer output. Please check the workflow logs.\n\n---\n_Review by [BecarIA](https://github.com/apps/becaria-reviewer)_',
    'COMMENT'
  );
  process.exit(1);
}

const body = formatReviewBody(review);
const event = review.approved ? 'APPROVE' : 'REQUEST_CHANGES';

await postReview(body, event);

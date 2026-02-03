/**
 * NPM Version Checker Utility
 *
 * Checks if the current n8n-mcp version is outdated by comparing
 * against the latest version published on npm.
 *
 * Fork Support (v2.34.0):
 * - Detects fork versions (containing '-fork' suffix)
 * - Checks both fork GitHub releases and upstream npm
 * - Provides separate update info for fork and upstream
 */

import { logger } from './logger';

/**
 * NPM Registry Response structure
 * Based on npm registry JSON format for package metadata
 */
interface NpmRegistryResponse {
  version: string;
  [key: string]: unknown;
}

/**
 * GitHub Release Response structure
 */
interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
}

export interface VersionCheckResult {
  currentVersion: string;
  latestVersion: string | null;
  isOutdated: boolean;
  updateAvailable: boolean;
  error: string | null;
  checkedAt: Date;
  updateCommand?: string;
  // Fork-specific fields
  isFork?: boolean;
  forkVersion?: string;
  latestForkVersion?: string | null;
  forkOutdated?: boolean;
  upstreamVersion?: string | null;
  upstreamOutdated?: boolean;
  forkRepo?: string;
}

// Cache for version check to avoid excessive npm requests
let versionCheckCache: VersionCheckResult | null = null;
let lastCheckTime: number = 0;
const CACHE_TTL_MS = 1 * 60 * 60 * 1000; // 1 hour cache

// Fork configuration
const FORK_REPO = 'daleiii/n8n-mcp';
const FORK_SUFFIX = '-fork';

/**
 * Detect if the current version is a fork version
 */
function isForkVersion(version: string): boolean {
  return version.includes(FORK_SUFFIX);
}

/**
 * Extract the base version from a fork version (e.g., "2.33.5-fork.1" -> "2.33.5")
 */
function getBaseVersion(version: string): string {
  const forkIndex = version.indexOf(FORK_SUFFIX);
  return forkIndex > 0 ? version.substring(0, forkIndex) : version;
}

/**
 * Fetch latest release from a GitHub repository
 */
async function fetchGitHubLatestRelease(repo: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'n8n-mcp-version-checker',
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      logger.debug(`GitHub release check failed for ${repo}`, { status: response.status });
      return null;
    }

    const data = await response.json() as GitHubRelease;
    // Remove 'v' prefix if present
    return data.tag_name?.replace(/^v/, '') || null;
  } catch (error) {
    logger.debug(`Error fetching GitHub release for ${repo}`, {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Fetch latest version from npm registry
 */
async function fetchNpmLatestVersion(): Promise<string | null> {
  try {
    const response = await fetch('https://registry.npmjs.org/n8n-mcp/latest', {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as NpmRegistryResponse;
    return data.version || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if current version is outdated compared to npm registry and fork releases
 * Uses caching to avoid excessive API calls
 *
 * For fork versions:
 * - Checks GitHub releases for the fork repo
 * - Also checks upstream npm to notify of upstream updates
 *
 * @param forceRefresh - Force a fresh check, bypassing cache
 * @returns Version check result
 */
export async function checkNpmVersion(forceRefresh: boolean = false): Promise<VersionCheckResult> {
  const now = Date.now();

  // Return cached result if available and not expired
  if (!forceRefresh && versionCheckCache && (now - lastCheckTime) < CACHE_TTL_MS) {
    logger.debug('Returning cached version check result');
    return versionCheckCache;
  }

  // Get current version from package.json
  const packageJson = require('../../package.json');
  const currentVersion: string = packageJson.version;
  const isFork = isForkVersion(currentVersion);
  const baseVersion = getBaseVersion(currentVersion);

  try {
    if (isFork) {
      // Fork version: check both fork releases and upstream npm
      const [forkLatest, upstreamLatest] = await Promise.all([
        fetchGitHubLatestRelease(FORK_REPO),
        fetchNpmLatestVersion()
      ]);

      const forkOutdated = forkLatest ? compareVersions(currentVersion, forkLatest) < 0 : false;
      const upstreamOutdated = upstreamLatest ? compareVersions(baseVersion, upstreamLatest) < 0 : false;

      const result: VersionCheckResult = {
        currentVersion,
        latestVersion: forkLatest,
        isOutdated: forkOutdated,
        updateAvailable: forkOutdated || upstreamOutdated,
        error: null,
        checkedAt: new Date(),
        // Fork-specific fields
        isFork: true,
        forkVersion: currentVersion,
        latestForkVersion: forkLatest,
        forkOutdated,
        upstreamVersion: upstreamLatest,
        upstreamOutdated,
        forkRepo: FORK_REPO,
        updateCommand: forkOutdated
          ? `docker pull ghcr.io/${FORK_REPO}:latest`
          : upstreamOutdated
            ? `Upstream update available: ${baseVersion} → ${upstreamLatest}. Consider syncing fork.`
            : undefined
      };

      versionCheckCache = result;
      lastCheckTime = now;

      logger.debug('Fork version check completed', {
        current: currentVersion,
        latestFork: forkLatest,
        latestUpstream: upstreamLatest,
        forkOutdated,
        upstreamOutdated
      });

      return result;

    } else {
      // Standard version: check npm registry only
      const latestVersion = await fetchNpmLatestVersion();

      if (!latestVersion) {
        const result: VersionCheckResult = {
          currentVersion,
          latestVersion: null,
          isOutdated: false,
          updateAvailable: false,
          error: 'Failed to fetch version from npm registry',
          checkedAt: new Date(),
          isFork: false
        };

        versionCheckCache = result;
        lastCheckTime = now;
        return result;
      }

      const isOutdated = compareVersions(currentVersion, latestVersion) < 0;

      const result: VersionCheckResult = {
        currentVersion,
        latestVersion,
        isOutdated,
        updateAvailable: isOutdated,
        error: null,
        checkedAt: new Date(),
        updateCommand: isOutdated ? `npm install -g n8n-mcp@${latestVersion}` : undefined,
        isFork: false
      };

      versionCheckCache = result;
      lastCheckTime = now;

      logger.debug('npm version check completed', {
        current: currentVersion,
        latest: latestVersion,
        outdated: isOutdated
      });

      return result;
    }

  } catch (error) {
    logger.warn('Error checking version', {
      error: error instanceof Error ? error.message : String(error)
    });

    const result: VersionCheckResult = {
      currentVersion,
      latestVersion: null,
      isOutdated: false,
      updateAvailable: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      checkedAt: new Date(),
      isFork
    };

    versionCheckCache = result;
    lastCheckTime = now;

    return result;
  }
}

/**
 * Compare two semantic version strings
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 *
 * @param v1 - First version (e.g., "1.2.3")
 * @param v2 - Second version (e.g., "1.3.0")
 * @returns Comparison result
 */
export function compareVersions(v1: string, v2: string): number {
  // Remove 'v' prefix if present
  const clean1 = v1.replace(/^v/, '');
  const clean2 = v2.replace(/^v/, '');

  // Split into parts and convert to numbers
  const parts1 = clean1.split('.').map(n => parseInt(n, 10) || 0);
  const parts2 = clean2.split('.').map(n => parseInt(n, 10) || 0);

  // Compare each part
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0; // Versions are equal
}

/**
 * Clear the version check cache (useful for testing)
 */
export function clearVersionCheckCache(): void {
  versionCheckCache = null;
  lastCheckTime = 0;
}

/**
 * Format version check result as a user-friendly message
 *
 * @param result - Version check result
 * @returns Formatted message
 */
export function formatVersionMessage(result: VersionCheckResult): string {
  if (result.error) {
    return `Version check failed: ${result.error}. Current version: ${result.currentVersion}`;
  }

  // Fork version handling
  if (result.isFork) {
    const messages: string[] = [];

    if (result.forkOutdated && result.latestForkVersion) {
      messages.push(`⚠️ Fork update available: ${result.currentVersion} → ${result.latestForkVersion}`);
    } else {
      messages.push(`✓ Fork is up to date: ${result.currentVersion}`);
    }

    if (result.upstreamOutdated && result.upstreamVersion) {
      const baseVersion = result.currentVersion.split('-fork')[0];
      messages.push(`📦 Upstream update: ${baseVersion} → ${result.upstreamVersion} (consider syncing)`);
    }

    return messages.join(' | ');
  }

  // Standard version handling
  if (!result.latestVersion) {
    return `Current version: ${result.currentVersion} (latest version unknown)`;
  }

  if (result.isOutdated) {
    return `⚠️ Update available! Current: ${result.currentVersion} → Latest: ${result.latestVersion}`;
  }

  return `✓ You're up to date! Current version: ${result.currentVersion}`;
}

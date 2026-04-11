import { execSync } from "node:child_process";

function readGitValue(command) {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const gitBranch =
  process.env.NEXT_PUBLIC_GIT_BRANCH ||
  process.env.GIT_BRANCH ||
  process.env.GITHUB_REF_NAME ||
  process.env.GITHUB_HEAD_REF ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.RAILWAY_GIT_BRANCH ||
  readGitValue("git rev-parse --abbrev-ref HEAD");

const gitSha =
  process.env.NEXT_PUBLIC_GIT_SHA ||
  process.env.GIT_COMMIT ||
  process.env.GITHUB_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.RAILWAY_GIT_COMMIT_SHA ||
  readGitValue("git rev-parse --short HEAD");

const buildTime =
  process.env.NEXT_PUBLIC_BUILD_TIME ||
  new Date().toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_GIT_BRANCH: gitBranch,
    NEXT_PUBLIC_GIT_SHA: gitSha ? gitSha.slice(0, 7) : "",
    NEXT_PUBLIC_BUILD_TIME: buildTime,
  },
};

export default nextConfig;

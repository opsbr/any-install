import { asset } from "./builder";

const tagPattern = new RegExp(
  "^/(?<owner>[^/]+)/(?<repo>[^/]+)/releases/download/(?<tag>[^/]+)/(?<file>.+)$",
);

const latestPattern = new RegExp(
  "^/(?<owner>[^/]+)/(?<repo>[^/]+)/releases/latest/download/(?<file>.+)$",
);

export const ghReleaseDownload = (url: string) => {
  const { origin, pathname } = new URL(url);
  const matchTag = pathname.match(tagPattern);
  if (matchTag?.groups) {
    const { owner, repo, tag, file } = matchTag.groups;
    return `gh release download "${tag}" --repo "${origin}/${owner}/${repo}" --pattern "${file}" --output "${asset}"`;
  }
  const matchLatest = pathname.match(latestPattern);
  if (matchLatest?.groups) {
    const { owner, repo, file } = matchLatest.groups;
    return `gh release download --repo "${origin}/${owner}/${repo}" --pattern "${file}" --output "${asset}"`;
  }
};

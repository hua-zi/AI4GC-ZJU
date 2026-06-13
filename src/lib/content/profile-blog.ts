import { loadBlogPostsByAuthorId } from "@/lib/content/load-blog";
import { extractBlogChannels } from "@/lib/content/member-blog-channels";
import {
  attachProfileBlogPosts,
  type ProfileBodySegment,
} from "@/lib/content/resolve-profile-papers";
import type { MemberLink } from "@/types/lab";

export function resolveProfileSegmentsWithBlog(
  memberId: string,
  segments: ProfileBodySegment[],
  links: MemberLink[],
  pathLabel: string,
): ProfileBodySegment[] {
  return attachProfileBlogPosts(
    segments,
    loadBlogPostsByAuthorId(memberId),
    extractBlogChannels(links, pathLabel),
  );
}

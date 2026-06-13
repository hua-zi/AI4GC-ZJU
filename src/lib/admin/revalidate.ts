import { revalidatePath } from "next/cache";

export function revalidateNews(): void {
  revalidatePath("/");
  revalidatePath("/news");
}

export function revalidateSite(): void {
  revalidatePath("/", "layout");
}

export function revalidateHome(): void {
  revalidatePath("/");
}

export function revalidateTeam(): void {
  revalidatePath("/team");
}

export function revalidatePublications(): void {
  revalidatePath("/publications");
}

export function revalidateBlog(): void {
  revalidatePath("/blog");
}

export function revalidateProfile(slug: string): void {
  revalidatePath(`/${slug}`);
}

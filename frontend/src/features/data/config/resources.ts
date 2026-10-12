import {
  resourceSlugSchema,
  type ResourceSlug,
} from "@/features/data/schemas/data";

export const resources = {
  users: {
    title: "Users",
    singular: "User",
    description: "The people who have an account in your workspace.",
  },
  "user-tokens": {
    title: "Sessions",
    singular: "Session",
    description: "Current sign-in sessions and their account owners.",
  },
  "user-permissions": {
    title: "Permissions",
    singular: "Permission",
    description: "Permission records associated with your users.",
  },
} satisfies Record<
  ResourceSlug,
  {
    title: string;
    singular: string;
    description: string;
  }
>;

export const resourceSlugs = resourceSlugSchema.options;

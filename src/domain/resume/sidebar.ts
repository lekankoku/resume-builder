// The narrow sidebar shows at most this many bullets under each ability and under leadership.
export const SIDEBAR_BULLET_LIMIT = 3;

export const sidebarBullets = (bullets: string[]): string[] => bullets.slice(0, SIDEBAR_BULLET_LIMIT);

// The Tech Stack is a focused list, not an inventory: at most 3 groups of at most 3 technologies each.
export const TECH_GROUP_LIMIT = 3;
export const TECH_ITEM_LIMIT = 3;

type TechGroup = { category: string; skills: string };

export const sidebarTechStack = <T extends TechGroup>(groups: T[]): T[] =>
  groups.slice(0, TECH_GROUP_LIMIT).map((group) => ({
    ...group,
    skills: group.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)
      .slice(0, TECH_ITEM_LIMIT)
      .join(', '),
  }));

import { describe, expect, it } from 'vitest';
import { sidebarBullets, sidebarTechStack } from './sidebar';

describe('sidebarBullets', () => {
  it('keeps the first 3 bullets', () => {
    expect(sidebarBullets(['a', 'b', 'c', 'd', 'e'])).toEqual(['a', 'b', 'c']);
  });

  it('keeps every bullet when there are 3 or fewer', () => {
    expect(sidebarBullets(['a', 'b'])).toEqual(['a', 'b']);
  });
});

describe('sidebarTechStack', () => {
  const group = (category: string, skills: string) => ({ category, skills });

  it('keeps the first 3 groups', () => {
    const groups = [group('A', 'a'), group('B', 'b'), group('C', 'c'), group('D', 'd')];

    expect(sidebarTechStack(groups).map((g) => g.category)).toEqual(['A', 'B', 'C']);
  });

  it('keeps the first 3 technologies of a group', () => {
    expect(sidebarTechStack([group('Backend', 'Java, Spring Boot,Kotlin , Node.js, Go, Rust, Python')])).toEqual([
      group('Backend', 'Java, Spring Boot, Kotlin'),
    ]);
  });
});

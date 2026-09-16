import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/rayfinClient', () => ({
  isLocalBackend: () => true,
  getRayfinClient: vi.fn(),
}));

import {
  addSessionComment,
  createSessionProposal,
  getSessionBoard,
  toggleSessionVolunteer,
  toggleSessionVote,
} from '@/services/sessions';

const user = {
  id: 'user-1',
  name: 'Avery',
  email: 'avery@example.com',
};

describe('sessions service (in-memory mode)', () => {
  beforeEach(async () => {
    const board = await getSessionBoard(user);
    for (const session of board) {
      if (session.hasVoted) {
        await toggleSessionVote(session.id, user);
      }
      if (session.hasVolunteered) {
        await toggleSessionVolunteer(session.id, user);
      }
    }
  });

  it('creates a proposal and tracks participation', async () => {
    await createSessionProposal(
      {
        title: 'Build useful agents',
        description: 'Compare patterns for grounded, reliable agents.',
        format: 'Interactive discussion',
        topic: 'AI',
      },
      user
    );

    const session = (await getSessionBoard(user))[0];
    expect(session).toBeDefined();

    await toggleSessionVote(session!.id, user);
    await toggleSessionVolunteer(session!.id, user);
    await addSessionComment(session!.id, 'Happy to share a demo.', user);

    const updated = (await getSessionBoard(user)).find(
      (item) => item.id === session!.id
    );
    expect(updated).toMatchObject({
      voteCount: 1,
      volunteerCount: 1,
      hasVoted: true,
      hasVolunteered: true,
    });
    expect(updated?.comments[0]?.body).toBe('Happy to share a demo.');
  });

  it('requires authentication for proposals', async () => {
    await expect(
      createSessionProposal(
        {
          title: 'Anonymous idea',
          description: 'Should not be accepted.',
          format: 'Discussion',
          topic: 'Other',
        },
        null
      )
    ).rejects.toThrow('You must be signed in');
  });
});

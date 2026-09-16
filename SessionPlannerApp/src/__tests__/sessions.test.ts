import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/rayfinClient', () => ({
  isLocalBackend: () => true,
  getRayfinClient: vi.fn(),
}));

import {
  addSessionComment,
  createSessionProposal,
  filterSessionBoard,
  getSessionBoard,
  sortSessionBoard,
  toggleSessionVolunteer,
  toggleSessionVote,
  updateSessionProposal,
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

  it('keeps newest ordering stable when participation changes', async () => {
    const sessions = await getSessionBoard(user);
    const newestBefore = sortSessionBoard(sessions, 'newest').map(
      (session) => session.id
    );

    await toggleSessionVote(newestBefore[0]!, user);

    const newestAfter = sortSessionBoard(
      await getSessionBoard(user),
      'newest'
    ).map((session) => session.id);
    expect(newestAfter).toEqual(newestBefore);
  });

  it('allows only the submitter to edit a proposal', async () => {
    const session = (await getSessionBoard(user))[0]!;
    await updateSessionProposal(
      session.id,
      {
        title: 'Updated session title',
        description: session.description,
        format: session.format,
        topic: session.topic,
      },
      user
    );

    expect(
      (await getSessionBoard(user)).find((item) => item.id === session.id)
        ?.title
    ).toBe('Updated session title');

    await expect(
      updateSessionProposal(
        session.id,
        {
          title: 'Unauthorized edit',
          description: session.description,
          format: session.format,
          topic: session.topic,
        },
        { id: 'user-2', name: 'Morgan', email: 'morgan@example.com' }
      )
    ).rejects.toThrow('Only the submitter');
  });

  it('lets a submitter volunteer while proposing a session', async () => {
    const sessionId = await createSessionProposal(
      {
        title: 'Facilitated from the start',
        description: 'A session with its facilitator already identified.',
        format: 'Hands-on workshop',
        topic: 'Developer tools',
      },
      user,
      true
    );

    const session = (await getSessionBoard(user)).find(
      (item) => item.id === sessionId
    );
    expect(session).toMatchObject({
      hasVolunteered: true,
      volunteerCount: 1,
    });
  });

  it('filters sessions by the current user participation', async () => {
    const sessionId = await createSessionProposal(
      {
        title: 'Filter test session',
        description: 'Exercises combined participation filters.',
        format: 'Interactive discussion',
        topic: 'Testing',
      },
      user
    );
    await toggleSessionVolunteer(sessionId, user);
    await toggleSessionVote(sessionId, user);
    await addSessionComment(sessionId, 'Interested in this topic.', user);

    const board = await getSessionBoard(user);
    const submitted = filterSessionBoard(board, ['submitted']);
    expect(submitted.some((session) => session.id === sessionId)).toBe(true);
    expect(
      submitted.every((session) => session.isSubmittedByCurrentUser)
    ).toBe(true);

    const upvoted = filterSessionBoard(board, ['upvoted']);
    expect(upvoted.some((session) => session.id === sessionId)).toBe(true);
    expect(upvoted.every((session) => session.hasVoted)).toBe(true);

    const commented = filterSessionBoard(board, ['commented']);
    expect(commented.some((session) => session.id === sessionId)).toBe(true);
    expect(commented.every((session) => session.hasCommented)).toBe(true);

    const unstaffed = filterSessionBoard(board, ['needs-facilitator']);
    expect(unstaffed.every((session) => session.volunteerCount === 0)).toBe(
      true
    );

    const submittedAndUpvoted = filterSessionBoard(board, [
      'submitted',
      'upvoted',
    ]);
    expect(submittedAndUpvoted.map((session) => session.id)).toEqual([sessionId]);
    expect(
      submittedAndUpvoted.every(
        (session) => session.isSubmittedByCurrentUser && session.hasVoted
      )
    ).toBe(true);
  });
});

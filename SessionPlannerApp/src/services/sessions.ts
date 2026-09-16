import type { AuthUser } from './IAuthService';
import { getRayfinClient, isLocalBackend } from './rayfinClient';

export interface SessionProposal {
  id: string;
  title: string;
  description: string;
  format: string;
  topic: string;
  createdById: string;
  createdByName: string;
  createdByEmail: string;
  createdAt: Date;
}

export interface SessionCommentItem {
  id: string;
  body: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface SessionBoardItem extends SessionProposal {
  voteCount: number;
  volunteerCount: number;
  volunteers: string[];
  comments: SessionCommentItem[];
  hasVoted: boolean;
  hasVolunteered: boolean;
}

export interface CreateSessionInput {
  title: string;
  description: string;
  format: string;
  topic: string;
}

interface VoteRecord {
  id: string;
  sessionId: string;
  userId: string;
  createdAt: Date;
}

interface VolunteerRecord extends VoteRecord {
  userName: string;
  userEmail: string;
}

interface CommentRecord extends SessionCommentItem {
  sessionId: string;
}

const localSessions: SessionProposal[] = [];
let localVotes: VoteRecord[] = [];
let localVolunteers: VolunteerRecord[] = [];
const localComments: CommentRecord[] = [];

function requireAuthenticatedUser(user: AuthUser | null): AuthUser {
  if (!user) {
    throw new Error('You must be signed in to participate.');
  }
  return user;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function buildBoard(
  sessions: SessionProposal[],
  votes: VoteRecord[],
  volunteers: VolunteerRecord[],
  comments: CommentRecord[],
  userId: string
): SessionBoardItem[] {
  return sessions
    .map((session) => {
      const sessionVotes = votes.filter(
        (vote) => vote.sessionId === session.id
      );
      const sessionVolunteers = volunteers.filter(
        (volunteer) => volunteer.sessionId === session.id
      );
      const sessionComments = comments
        .filter((comment) => comment.sessionId === session.id)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      return {
        ...session,
        voteCount: sessionVotes.length,
        volunteerCount: sessionVolunteers.length,
        volunteers: sessionVolunteers.map((volunteer) => volunteer.userName),
        comments: sessionComments.map(
          ({ id, body, userId: commentUserId, userName, createdAt }) => ({
            id,
            body,
            userId: commentUserId,
            userName,
            createdAt,
          })
        ),
        hasVoted: sessionVotes.some((vote) => vote.userId === userId),
        hasVolunteered: sessionVolunteers.some(
          (volunteer) => volunteer.userId === userId
        ),
      };
    })
    .sort(
      (a, b) =>
        b.voteCount - a.voteCount ||
        b.createdAt.getTime() - a.createdAt.getTime()
    );
}

export async function getSessionBoard(
  currentUser: AuthUser | null
): Promise<SessionBoardItem[]> {
  const user = requireAuthenticatedUser(currentUser);

  if (isLocalBackend()) {
    return buildBoard(
      localSessions,
      localVotes,
      localVolunteers,
      localComments,
      user.id
    );
  }

  const client = getRayfinClient();
  const [sessions, votes, volunteers, comments] = await Promise.all([
    client.data.SessionIdea.select([
      'id',
      'title',
      'description',
      'format',
      'topic',
      'created_by_id',
      'created_by_name',
      'created_by_email',
      'created_at',
    ])
      .first(-1)
      .execute(),
    client.data.SessionVote.select([
      'id',
      'session_id',
      'user_id',
      'created_at',
    ])
      .first(-1)
      .execute(),
    client.data.SessionVolunteer.select([
      'id',
      'session_id',
      'user_id',
      'user_name',
      'user_email',
      'created_at',
    ])
      .first(-1)
      .execute(),
    client.data.SessionComment.select([
      'id',
      'session_id',
      'body',
      'user_id',
      'user_name',
      'created_at',
    ])
      .first(-1)
      .execute(),
  ]);

  return buildBoard(
    sessions.map((session) => ({
      id: session.id,
      title: session.title,
      description: session.description,
      format: session.format,
      topic: session.topic,
      createdById: session.created_by_id,
      createdByName: session.created_by_name,
      createdByEmail: session.created_by_email,
      createdAt: toDate(session.created_at),
    })),
    votes.map((vote) => ({
      id: vote.id,
      sessionId: vote.session_id,
      userId: vote.user_id,
      createdAt: toDate(vote.created_at),
    })),
    volunteers.map((volunteer) => ({
      id: volunteer.id,
      sessionId: volunteer.session_id,
      userId: volunteer.user_id,
      userName: volunteer.user_name,
      userEmail: volunteer.user_email,
      createdAt: toDate(volunteer.created_at),
    })),
    comments.map((comment) => ({
      id: comment.id,
      sessionId: comment.session_id,
      body: comment.body,
      userId: comment.user_id,
      userName: comment.user_name,
      createdAt: toDate(comment.created_at),
    })),
    user.id
  );
}

export async function createSessionProposal(
  input: CreateSessionInput,
  currentUser: AuthUser | null
): Promise<void> {
  const user = requireAuthenticatedUser(currentUser);
  const createdAt = new Date();

  if (isLocalBackend()) {
    localSessions.push({
      id: crypto.randomUUID(),
      ...input,
      createdById: user.id,
      createdByName: user.name,
      createdByEmail: user.email,
      createdAt,
    });
    return;
  }

  await getRayfinClient().data.SessionIdea.create({
    ...input,
    created_by_id: user.id,
    created_by_name: user.name,
    created_by_email: user.email,
    created_at: createdAt,
  });
}

export async function toggleSessionVote(
  sessionId: string,
  currentUser: AuthUser | null
): Promise<void> {
  const user = requireAuthenticatedUser(currentUser);
  const actionKey = `${sessionId}:${user.id}`;

  if (isLocalBackend()) {
    const existing = localVotes.find(
      (vote) => vote.sessionId === sessionId && vote.userId === user.id
    );
    localVotes = existing
      ? localVotes.filter((vote) => vote.id !== existing.id)
      : [
          ...localVotes,
          {
            id: crypto.randomUUID(),
            sessionId,
            userId: user.id,
            createdAt: new Date(),
          },
        ];
    return;
  }

  const client = getRayfinClient();
  const existing = await client.data.SessionVote.select(['id'])
    .where({ action_key: { eq: actionKey } })
    .execute();
  if (existing[0]) {
    await client.data.SessionVote.delete({ id: existing[0].id });
    return;
  }

  await client.data.SessionVote.create({
    session_id: sessionId,
    user_id: user.id,
    action_key: actionKey,
    created_at: new Date(),
  });
}

export async function toggleSessionVolunteer(
  sessionId: string,
  currentUser: AuthUser | null
): Promise<void> {
  const user = requireAuthenticatedUser(currentUser);
  const actionKey = `${sessionId}:${user.id}`;

  if (isLocalBackend()) {
    const existing = localVolunteers.find(
      (volunteer) =>
        volunteer.sessionId === sessionId && volunteer.userId === user.id
    );
    localVolunteers = existing
      ? localVolunteers.filter((volunteer) => volunteer.id !== existing.id)
      : [
          ...localVolunteers,
          {
            id: crypto.randomUUID(),
            sessionId,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            createdAt: new Date(),
          },
        ];
    return;
  }

  const client = getRayfinClient();
  const existing = await client.data.SessionVolunteer.select(['id'])
    .where({ action_key: { eq: actionKey } })
    .execute();
  if (existing[0]) {
    await client.data.SessionVolunteer.delete({ id: existing[0].id });
    return;
  }

  await client.data.SessionVolunteer.create({
    session_id: sessionId,
    user_id: user.id,
    user_name: user.name,
    user_email: user.email,
    action_key: actionKey,
    created_at: new Date(),
  });
}

export async function addSessionComment(
  sessionId: string,
  body: string,
  currentUser: AuthUser | null
): Promise<void> {
  const user = requireAuthenticatedUser(currentUser);
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    throw new Error('Comment cannot be empty.');
  }

  if (isLocalBackend()) {
    localComments.push({
      id: crypto.randomUUID(),
      sessionId,
      body: trimmedBody,
      userId: user.id,
      userName: user.name,
      createdAt: new Date(),
    });
    return;
  }

  await getRayfinClient().data.SessionComment.create({
    session_id: sessionId,
    body: trimmedBody,
    user_id: user.id,
    user_name: user.name,
    created_at: new Date(),
  });
}

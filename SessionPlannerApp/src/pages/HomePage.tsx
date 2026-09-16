import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/AuthContext';
import {
  addSessionComment,
  createSessionProposal,
  getSessionBoard,
  toggleSessionVolunteer,
  toggleSessionVote,
  type CreateSessionInput,
  type SessionBoardItem,
} from '@/services/sessions';

const emptyProposal: CreateSessionInput = {
  title: '',
  description: '',
  format: 'Interactive discussion',
  topic: '',
};

export function HomePage() {
  const { signOut, user } = useAuth();
  const [sessions, setSessions] = useState<SessionBoardItem[]>([]);
  const [proposal, setProposal] = useState(emptyProposal);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [sort, setSort] = useState<'popular' | 'newest'>('popular');
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setError(null);
      setSessions(await getSessionBoard(user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sessions.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort((a, b) =>
        sort === 'popular'
          ? b.voteCount - a.voteCount ||
            b.createdAt.getTime() - a.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime()
      ),
    [sessions, sort]
  );

  const runAction = async (sessionId: string, action: () => Promise<void>) => {
    setWorkingId(sessionId);
    setError(null);
    try {
      await action();
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setWorkingId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !proposal.title.trim() ||
      !proposal.description.trim() ||
      !proposal.topic.trim()
    ) {
      return;
    }

    setWorkingId('new');
    setError(null);
    try {
      await createSessionProposal(
        {
          ...proposal,
          title: proposal.title.trim(),
          description: proposal.description.trim(),
          topic: proposal.topic.trim(),
        },
        user
      );
      setProposal(emptyProposal);
      setShowProposalForm(false);
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add session.');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f2] text-slate-900">
      <header className="border-b border-slate-200 bg-[#102a43] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f6c453] font-black text-[#102a43]">
              FD
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">FieldDays</p>
              <p className="text-xs text-slate-300">Session planner</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-300 sm:inline">
              {user?.name}
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg border border-white/20 px-3 py-2 text-sm transition hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <section className="overflow-hidden rounded-3xl bg-[#1f5d50] text-white shadow-xl shadow-emerald-950/10">
          <div className="grid gap-8 px-6 py-9 sm:px-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#f6c453]">
                Build the agenda together
              </p>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
                What should we explore at FieldDays?
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-50/80">
                Share a session idea, support the topics you care about, and
                volunteer to help turn great conversations into reality.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowProposalForm((visible) => !visible)}
              className="rounded-xl bg-[#f6c453] px-6 py-3 font-bold text-[#102a43] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#ffd36a]"
            >
              {showProposalForm ? 'Close form' : '+ Propose a session'}
            </button>
          </div>
        </section>

        {showProposalForm && (
          <ProposalForm
            proposal={proposal}
            submitting={workingId === 'new'}
            onChange={setProposal}
            onSubmit={handleSubmit}
          />
        )}

        <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1f5d50]">
              {sessions.length} proposed {sessions.length === 1 ? 'session' : 'sessions'}
            </p>
            <h2 className="text-3xl font-black tracking-tight">
              Community ideas
            </h2>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {(['popular', 'newest'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSort(option)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                  sort === option
                    ? 'bg-[#102a43] text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center text-slate-500">
            Loading session ideas...
          </div>
        ) : sortedSessions.length === 0 ? (
          <div className="mt-6 rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-20 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-2xl">
              ✦
            </div>
            <h3 className="text-xl font-bold">Start the conversation</h3>
            <p className="mx-auto mt-2 max-w-md text-slate-500">
              No sessions have been proposed yet. Add the first idea and give
              the FieldDays community something to rally around.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
            {sortedSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                disabled={workingId === session.id}
                onVote={() =>
                  runAction(session.id, () =>
                    toggleSessionVote(session.id, user)
                  )
                }
                onVolunteer={() =>
                  runAction(session.id, () =>
                    toggleSessionVolunteer(session.id, user)
                  )
                }
                onComment={(body) =>
                  runAction(session.id, () =>
                    addSessionComment(session.id, body, user)
                  )
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ProposalForm({
  proposal,
  submitting,
  onChange,
  onSubmit,
}: {
  proposal: CreateSessionInput;
  submitting: boolean;
  onChange: (proposal: CreateSessionInput) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="text-2xl font-black">Propose a FieldDays session</h2>
      <p className="mt-1 text-sm text-slate-500">
        A clear title and a few sentences are enough to get the idea moving.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-2 block text-sm font-bold">Session title</span>
          <input
            required
            maxLength={160}
            value={proposal.title}
            onChange={(event) =>
              onChange({ ...proposal, title: event.target.value })
            }
            placeholder="e.g. From prototype to production with Fabric"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#1f5d50] focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-bold">Topic</span>
          <input
            required
            maxLength={80}
            value={proposal.topic}
            onChange={(event) =>
              onChange({ ...proposal, topic: event.target.value })
            }
            placeholder="AI, Data, Developer tools..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#1f5d50] focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-bold">Format</span>
          <select
            value={proposal.format}
            onChange={(event) =>
              onChange({ ...proposal, format: event.target.value })
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#1f5d50] focus:ring-2 focus:ring-emerald-100"
          >
            <option>Interactive discussion</option>
            <option>Hands-on workshop</option>
            <option>Demo and Q&amp;A</option>
            <option>Panel conversation</option>
            <option>Lightning talks</option>
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="mb-2 block text-sm font-bold">Description</span>
          <textarea
            required
            maxLength={4000}
            rows={4}
            value={proposal.description}
            onChange={(event) =>
              onChange({ ...proposal, description: event.target.value })
            }
            placeholder="What will participants discuss, learn, or create?"
            className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#1f5d50] focus:ring-2 focus:ring-emerald-100"
          />
        </label>
      </div>
      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-[#1f5d50] px-6 py-3 font-bold text-white transition hover:bg-[#174a3f] disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Share session idea'}
        </button>
      </div>
    </form>
  );
}

function SessionCard({
  session,
  disabled,
  onVote,
  onVolunteer,
  onComment,
}: {
  session: SessionBoardItem;
  disabled: boolean;
  onVote: () => void;
  onVolunteer: () => void;
  onComment: (body: string) => void;
}) {
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const submitComment = (event: React.FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) return;
    onComment(comment);
    setComment('');
    setShowComments(true);
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#1f5d50]">
            {session.topic}
          </span>
          <span className="text-xs text-slate-400">{session.format}</span>
        </div>
        <h3 className="mt-4 text-2xl font-black leading-tight">
          {session.title}
        </h3>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
          {session.description}
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 font-bold text-slate-600">
            {session.createdByName.charAt(0).toUpperCase()}
          </span>
          Proposed by {session.createdByName}
        </div>

        {session.volunteers.length > 0 && (
          <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-bold">Facilitators:</span>{' '}
            {session.volunteers.join(', ')}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          <button
            type="button"
            disabled={disabled}
            onClick={onVote}
            aria-pressed={session.hasVoted}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              session.hasVoted
                ? 'bg-[#f6c453] text-[#102a43]'
                : 'bg-slate-100 text-slate-700 hover:bg-amber-100'
            } disabled:opacity-50`}
          >
            ▲ {session.voteCount} {session.hasVoted ? 'Upvoted' : 'Upvote'}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onVolunteer}
            aria-pressed={session.hasVolunteered}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              session.hasVolunteered
                ? 'bg-emerald-100 text-[#1f5d50]'
                : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
            } disabled:opacity-50`}
          >
            {session.hasVolunteered ? '✓ Volunteering' : 'Volunteer to help'}{' '}
            {session.volunteerCount > 0 && `(${session.volunteerCount})`}
          </button>
          <button
            type="button"
            onClick={() => setShowComments((visible) => !visible)}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
          >
            💬 {session.comments.length}
          </button>
        </div>
      </div>

      {showComments && (
        <div className="border-t border-slate-200 bg-slate-50 p-5">
          <div className="space-y-3">
            {session.comments.length === 0 ? (
              <p className="text-sm text-slate-400">
                No comments yet. Start the discussion.
              </p>
            ) : (
              session.comments.map((item) => (
                <div key={item.id} className="text-sm">
                  <span className="font-bold text-slate-700">
                    {item.userName}
                  </span>
                  <span className="ml-2 text-slate-600">{item.body}</span>
                </div>
              ))
            )}
          </div>
          <form onSubmit={submitComment} className="mt-4 flex gap-2">
            <input
              value={comment}
              maxLength={2000}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Add to the conversation..."
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1f5d50]"
            />
            <button
              type="submit"
              disabled={disabled || !comment.trim()}
              className="rounded-xl bg-[#102a43] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

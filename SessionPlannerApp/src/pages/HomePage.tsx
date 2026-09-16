import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/AuthContext';
import {
  addSessionComment,
  createSessionProposal,
  filterSessionBoard,
  getSessionBoard,
  sortSessionBoard,
  toggleSessionVolunteer,
  toggleSessionVote,
  updateSessionProposal,
  type CreateSessionInput,
  type SessionBoardItem,
  type SessionFilter,
  type SessionSort,
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
  const [volunteerToFacilitate, setVolunteerToFacilitate] = useState(false);
  const [editProposal, setEditProposal] = useState(emptyProposal);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [sort, setSort] = useState<SessionSort>('popular');
  const [filters, setFilters] = useState<SessionFilter[]>([]);
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
    () => sortSessionBoard(filterSessionBoard(sessions, filters), sort),
    [filters, sessions, sort]
  );

  const toggleFilter = (filter: SessionFilter) => {
    setFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter]
    );
  };

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
        user,
        volunteerToFacilitate
      );
      setProposal(emptyProposal);
      setVolunteerToFacilitate(false);
      setShowProposalForm(false);
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add session.');
    } finally {
      setWorkingId(null);
    }
  };

  const beginEdit = (session: SessionBoardItem) => {
    setEditingSessionId(session.id);
    setEditProposal({
      title: session.title,
      description: session.description,
      format: session.format,
      topic: session.topic,
    });
  };

  const handleEdit = async (
    event: React.FormEvent,
    sessionId: string
  ) => {
    event.preventDefault();
    if (
      !editProposal.title.trim() ||
      !editProposal.description.trim() ||
      !editProposal.topic.trim()
    ) {
      return;
    }

    setWorkingId(sessionId);
    setError(null);
    try {
      await updateSessionProposal(
        sessionId,
        {
          ...editProposal,
          title: editProposal.title.trim(),
          description: editProposal.description.trim(),
          topic: editProposal.topic.trim(),
        },
        user
      );
      setEditingSessionId(null);
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not edit session.');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-hub-canvas text-slate-900">
      <header className="border-b border-hub-blue bg-hub-blue text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-hub-lime font-black text-hub-purple">
              FD
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">FieldDays</p>
              <p className="text-xs text-white/75">Session planner</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-white/75 sm:inline">
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
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-hub-blue to-hub-purple text-white shadow-xl shadow-hub-purple/15">
          <div className="grid gap-8 px-6 py-9 sm:px-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-hub-lime">
                Build the agenda together
              </p>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
                What should we explore at FieldDays?
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">
                Share a session idea, support the topics you care about, and
                volunteer to help turn great conversations into reality.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowProposalForm((visible) => !visible)}
              className="rounded-xl bg-hub-lime px-6 py-3 font-bold text-hub-purple shadow-lg transition hover:-translate-y-0.5 hover:brightness-105"
            >
              {showProposalForm ? 'Close form' : '+ Propose a session'}
            </button>
          </div>
        </section>

        {showProposalForm && (
          <ProposalForm
            proposal={proposal}
            submitting={workingId === 'new'}
            facilitate={volunteerToFacilitate}
            onFacilitateChange={setVolunteerToFacilitate}
            onChange={setProposal}
            onSubmit={handleSubmit}
          />
        )}

        <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-hub-blue">
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
                    ? 'bg-hub-blue text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" aria-label="Filter sessions">
          <button
            type="button"
            onClick={() => setFilters([])}
            aria-pressed={filters.length === 0}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              filters.length === 0
                ? 'border-hub-blue bg-hub-blue text-white'
                : 'border-hub-neutral bg-white text-slate-600 hover:border-hub-blue hover:text-hub-blue'
            }`}
          >
            All sessions
          </button>
          {(
            [
              ['needs-facilitator', 'Needs a facilitator'],
              ['submitted', 'My submissions'],
              ['upvoted', "I've upvoted"],
              ['commented', "I've commented"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleFilter(value)}
              aria-pressed={filters.includes(value)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                filters.includes(value)
                  ? 'border-hub-blue bg-hub-blue text-white'
                  : 'border-hub-neutral bg-white text-slate-600 hover:border-hub-blue hover:text-hub-blue'
              }`}
            >
              {label}
            </button>
          ))}
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
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-hub-lime text-2xl text-hub-purple">
              ✦
            </div>
            <h3 className="text-xl font-bold">
              {sessions.length === 0
                ? 'Start the conversation'
                : 'No sessions match this filter'}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-slate-500">
              {sessions.length === 0
                ? 'No sessions have been proposed yet. Add the first idea and give the FieldDays community something to rally around.'
                : 'Remove one or more filters to see additional session ideas.'}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
            {sortedSessions.map((session) => (
              editingSessionId === session.id ? (
                <ProposalForm
                  key={session.id}
                  proposal={editProposal}
                  submitting={workingId === session.id}
                  title="Edit your session"
                  description="Update the details while keeping the original submission date."
                  submitLabel="Save changes"
                  onChange={setEditProposal}
                  onSubmit={(event) => void handleEdit(event, session.id)}
                  onCancel={() => setEditingSessionId(null)}
                />
              ) : (
                <SessionCard
                  key={session.id}
                  session={session}
                  disabled={workingId === session.id}
                  canEdit={session.createdById === user?.id}
                  onEdit={() => beginEdit(session)}
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
              )
            ))}
          </div>
        )}
      </main>
      <footer className="border-t border-hub-neutral bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>Help us improve the FieldDays Session Planner.</span>
          <a
            href="https://github.com/roberts-andy/FieldDays-Session-Manager/issues"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-hub-blue underline decoration-hub-blue/30 underline-offset-4 transition hover:decoration-hub-blue"
          >
            Request a feature or report a bug
          </a>
        </div>
      </footer>
    </div>
  );
}

function ProposalForm({
  proposal,
  submitting,
  title = 'Propose a FieldDays session',
  description = 'A clear title and a few sentences are enough to get the idea moving.',
  submitLabel = 'Share session idea',
  facilitate,
  onChange,
  onFacilitateChange,
  onSubmit,
  onCancel,
}: {
  proposal: CreateSessionInput;
  submitting: boolean;
  title?: string;
  description?: string;
  submitLabel?: string;
  facilitate?: boolean;
  onChange: (proposal: CreateSessionInput) => void;
  onFacilitateChange?: (facilitate: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel?: () => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="text-2xl font-black">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
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
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-hub-blue focus:ring-2 focus:ring-hub-blue/20"
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
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-hub-blue focus:ring-2 focus:ring-hub-blue/20"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-bold">Format</span>
          <select
            value={proposal.format}
            onChange={(event) =>
              onChange({ ...proposal, format: event.target.value })
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-hub-blue focus:ring-2 focus:ring-hub-blue/20"
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
            className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-hub-blue focus:ring-2 focus:ring-hub-blue/20"
          />
        </label>
      </div>
      {onFacilitateChange && (
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-hub-lime bg-hub-lime/20 px-4 py-3">
          <input
            type="checkbox"
            checked={facilitate}
            onChange={(event) => onFacilitateChange(event.target.checked)}
            className="mt-1 h-4 w-4 accent-hub-blue"
          />
          <span>
            <span className="block text-sm font-bold text-slate-800">
              I can facilitate this session
            </span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-600">
              Leave this unchecked if you want to learn about the topic and
              would prefer someone else to facilitate.
            </span>
          </span>
        </label>
      )}
      <div className="mt-5 flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            disabled={submitting}
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-hub-blue px-6 py-3 font-bold text-white transition hover:brightness-95 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function SessionCard({
  session,
  disabled,
  canEdit,
  onEdit,
  onVote,
  onVolunteer,
  onComment,
}: {
  session: SessionBoardItem;
  disabled: boolean;
  canEdit: boolean;
  onEdit: () => void;
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
          <span className="rounded-full bg-hub-blue/10 px-3 py-1 text-xs font-bold text-hub-blue">
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
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 font-bold text-slate-600">
              {session.createdByName.charAt(0).toUpperCase()}
            </span>
            Proposed by {session.createdByName}
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              title="Edit"
              aria-label="Edit session proposal"
              className="grid h-8 w-8 place-items-center rounded-lg text-hub-blue transition hover:bg-hub-blue/10"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          )}
        </div>

        {session.volunteers.length > 0 && (
          <div className="mt-4 rounded-xl bg-hub-lime/25 px-4 py-3 text-sm text-hub-purple">
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
                ? 'bg-hub-lime text-hub-purple'
                : 'bg-slate-100 text-slate-700 hover:bg-hub-lime/40'
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
                ? 'bg-hub-blue/15 text-hub-blue'
                : 'bg-slate-100 text-slate-700 hover:bg-hub-blue/10'
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
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-hub-blue"
            />
            <button
              type="submit"
              disabled={disabled || !comment.trim()}
              className="rounded-xl bg-hub-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

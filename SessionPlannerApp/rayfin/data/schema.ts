import { SessionComment } from './SessionComment.js';
import { SessionIdea } from './SessionIdea.js';
import { SessionVolunteer } from './SessionVolunteer.js';
import { SessionVote } from './SessionVote.js';

export type FieldDaysSchema = {
  SessionIdea: SessionIdea;
  SessionVote: SessionVote;
  SessionVolunteer: SessionVolunteer;
  SessionComment: SessionComment;
};

export type BlankAppSchema = FieldDaysSchema;

export const schema = [
  SessionIdea,
  SessionVote,
  SessionVolunteer,
  SessionComment,
];

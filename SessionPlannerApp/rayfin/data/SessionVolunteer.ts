import {
  authenticated,
  date,
  entity,
  one,
  text,
  uuid,
} from '@microsoft/rayfin-core';

import { SessionIdea } from './SessionIdea.js';

@entity()
@authenticated('read')
@authenticated('create', {
  policy: (claims, item) => claims.sub.eq(item.user_id),
})
@authenticated('delete', {
  policy: (claims, item) => claims.sub.eq(item.user_id),
})
export class SessionVolunteer {
  @uuid() id!: string;
  @uuid() session_id!: string;
  @one(() => SessionIdea, { optional: true }) session?: SessionIdea;
  @text({ max: 200 }) user_id!: string;
  @text({ max: 200 }) user_name!: string;
  @text({ max: 320 }) user_email!: string;
  @text({ max: 400, unique: true }) action_key!: string;
  @date() created_at!: Date;
}

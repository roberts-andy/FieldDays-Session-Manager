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
export class SessionComment {
  @uuid() id!: string;
  @uuid() session_id!: string;
  @one(() => SessionIdea, { optional: true }) session?: SessionIdea;
  @text({ max: 2000 }) body!: string;
  @text({ max: 200 }) user_id!: string;
  @text({ max: 200 }) user_name!: string;
  @date() created_at!: Date;
}

import {
  authenticated,
  date,
  entity,
  text,
  uuid,
} from '@microsoft/rayfin-core';

@entity()
@authenticated('read')
@authenticated('create', {
  policy: (claims, item) => claims.sub.eq(item.created_by_id),
})
@authenticated(['update', 'delete'], {
  policy: (claims, item) => claims.sub.eq(item.created_by_id),
})
export class SessionIdea {
  @uuid() id!: string;
  @text({ max: 160 }) title!: string;
  @text({ max: 4000 }) description!: string;
  @text({ max: 80 }) format!: string;
  @text({ max: 80 }) topic!: string;
  @text({ max: 200 }) created_by_id!: string;
  @text({ max: 200 }) created_by_name!: string;
  @text({ max: 320 }) created_by_email!: string;
  @date() created_at!: Date;
}

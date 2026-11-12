import { TicketPriority } from './ticket-priority.enum.js';
import { TicketStatus } from './ticket-status.enum.js';
import { UserRole } from './user-role.enum.js';

describe('Helpdesk domain enums', () => {
  it('preserves Laravel role values', () => {
    expect(Object.values(UserRole)).toEqual(['user', 'support', 'admin']);
  });

  it('preserves Laravel ticket status values', () => {
    expect(Object.values(TicketStatus)).toEqual([
      'open',
      'in_progress',
      'resolved',
      'closed',
    ]);
  });

  it('preserves Laravel ticket priority values', () => {
    expect(Object.values(TicketPriority)).toEqual([
      'low',
      'medium',
      'high',
      'urgent',
    ]);
  });
});

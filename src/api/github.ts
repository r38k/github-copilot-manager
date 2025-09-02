import { Octokit } from 'octokit';
import type { Result } from '../utils/result.js';
import { ok, err } from '../utils/result.js';
import type { UserSeat } from '../models/types.js';

export type GitHubSeatsError = 
  | { kind: 'AuthError'; message: string }
  | { kind: 'NetworkError'; message: string }
  | { kind: 'ParseError'; message: string };

export interface GitHubSeatsService {
  loadSeats(org: string): Promise<Result<UserSeat[], GitHubSeatsError>>;
}

type CopilotSeat = {
  assignee: {
    login: string;
    id: number;
  };
  created_at: string;
  pending_cancellation_date: string | null;
  last_activity_at: string | null;
};

type CopilotSeatsResponse = {
  total_seats: number;
  seats: CopilotSeat[];
};

export const createGitHubSeatsService = (token?: string): GitHubSeatsService => {
  const octokit = new Octokit({
    auth: token || process.env.GITHUB_TOKEN,
  });

  const loadSeats = async (org: string): Promise<Result<UserSeat[], GitHubSeatsError>> => {
    try {
      const response = await octokit.rest.copilot.listCopilotSeats({
        org,
      });

      const data = response.data as CopilotSeatsResponse;
      
      const seats: UserSeat[] = data.seats.map(seat => ({
        login: seat.assignee.login,
        userId: seat.assignee.id,
        assignedAt: seat.created_at,
        pendingCancellationDate: seat.pending_cancellation_date,
        lastActivityAt: seat.last_activity_at,
      }));

      return ok(seats);
    } catch (error: any) {
      if (error.status === 401 || error.status === 403) {
        return err({
          kind: 'AuthError',
          message: 'GitHub API authentication failed. Check your token and permissions.',
        });
      }
      
      if (error.request && !error.response) {
        return err({
          kind: 'NetworkError',
          message: 'Network error: Unable to reach GitHub API',
        });
      }

      return err({
        kind: 'ParseError',
        message: `GitHub API error: ${error.message || 'Unknown error'}`,
      });
    }
  };

  return { loadSeats };
};
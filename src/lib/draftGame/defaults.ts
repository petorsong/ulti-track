import type { TimeoutsJson } from '@/database/schema';

export function defaultTimeouts(): TimeoutsJson {
  return {
    perHalf: 2,
    ourTimeouts: { firstHalf: 2, secondHalf: 2 },
    vsTimeouts: { firstHalf: 2, secondHalf: 2 },
  };
}

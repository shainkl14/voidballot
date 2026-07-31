/**
 * Chamber catalog — product narrative around the live Midnight contract.
 * Only `status: 'live'` maps to the deployed chamber; others are upcoming floors.
 */

export type ChamberStatus = 'live' | 'upcoming' | 'sealed';

export type Chamber = {
  id: string;
  title: string;
  summary: string;
  category: string;
  status: ChamberStatus;
  closesLabel: string;
  stakes: string;
  /** Friendly question shown on the ballot desk */
  question: string;
};

export const CHAMBERS: Chamber[] = [
  {
    id: 'preview-floor',
    title: 'Preview civic floor',
    summary:
      'Should Midnight preview chambers publish weekly public tallies while keeping every voter identity sealed?',
    category: 'Governance',
    status: 'live',
    closesLabel: 'Open now',
    stakes: 'Sets the default for how anonymous floors report progress.',
    question:
      'Approve weekly public tallies for preview chambers, with voter identity remaining sealed?',
  },
  {
    id: 'treasury-cadence',
    title: 'Treasury cadence',
    summary: 'Move community grants to a fixed monthly review window instead of rolling approvals.',
    category: 'Treasury',
    status: 'upcoming',
    closesLabel: 'Opens next cycle',
    stakes: 'Changes how capital moves without revealing who pushed which vote.',
    question: 'Adopt a fixed monthly grants review window?',
  },
  {
    id: 'delegate-roster',
    title: 'Delegate roster policy',
    summary: 'Allow optional public delegate badges while ballots stay nullifier-bound.',
    category: 'Identity',
    status: 'upcoming',
    closesLabel: 'Drafting',
    stakes: 'Separates reputation theatre from ballot privacy.',
    question: 'Allow optional public delegate badges without linking ballots?',
  },
  {
    id: 'archive-seal',
    title: 'Archive seal (pilot)',
    summary: 'Pilot chamber that closed after proving the nullifier model under load.',
    category: 'Archive',
    status: 'sealed',
    closesLabel: 'Sealed',
    stakes: 'Reference floor for auditors and newcomers.',
    question: 'Did the pilot chamber validate sealed ballots with public tallies?',
  },
];

export function liveChamber(): Chamber {
  return CHAMBERS.find((c) => c.status === 'live') ?? CHAMBERS[0];
}

export function chamberById(id: string): Chamber | undefined {
  return CHAMBERS.find((c) => c.id === id);
}

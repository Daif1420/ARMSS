import { AllocationRangeConfig, Box, Dossier, Project } from '../types';

export const DEFAULT_ALLOCATION_RANGES: AllocationRangeConfig[] = [
  { box: 'D41', first_project: 35150, last_project: 35449, capacity: 300 },
  { box: 'D42', first_project: 35500, last_project: 35799, capacity: 300 },
];

/**
 * Finds the allocation for a given Job ID based on configured box ranges.
 * Respects standard 6 dossiers / 50 projects per dossier (300 capacity).
 * Does not gap-fill or invent ranges.
 */
export function getAllocationForJobId(
  jobId: number,
  ranges: AllocationRangeConfig[]
): {
  boxNumber: string;
  dossierNumber: number;
  archivePosition: number;
} | null {
  for (const range of ranges) {
    if (jobId >= range.first_project && jobId <= range.last_project) {
      const archivePosition = jobId - range.first_project + 1;
      const dossierNumber = Math.min(
        6,
        Math.max(1, Math.ceil(archivePosition / 50))
      );
      return {
        boxNumber: range.box,
        dossierNumber,
        archivePosition,
      };
    }
  }
  return null;
}

/**
 * Generates the 6 standard dossiers for a box based on its configured first and last project numbers.
 */
export function getDossiersForBox(
  box: Box,
  allProjects: Project[]
): Dossier[] {
  const dossiers: Dossier[] = [];
  const projectsPerDossier = box.projects_per_dossier || 50;

  for (let d = 1; d <= box.dossier_count; d++) {
    const firstProj = box.first_project + (d - 1) * projectsPerDossier;
    const lastProj = Math.min(
      box.last_project,
      box.first_project + d * projectsPerDossier - 1
    );

    const posStart = (d - 1) * projectsPerDossier + 1;
    const posEnd = d * projectsPerDossier;

    // Determine status of dossier
    const dossierProjects = allProjects.filter(
      (p) => p.box_number === box.box_number && p.dossier_number === d
    );
    const completedCount = dossierProjects.filter((p) => p.status === 'Completed' || p.status === 'Delivered').length;

    let status: 'Pending' | 'In Progress' | 'Completed' = 'Pending';
    if (completedCount === projectsPerDossier && dossierProjects.length === projectsPerDossier) {
      status = 'Completed';
    } else if (dossierProjects.length > 0 || completedCount > 0) {
      status = 'In Progress';
    }

    dossiers.push({
      dossier_number: d,
      box_number: box.box_number,
      first_project: firstProj,
      last_project: lastProj,
      capacity: projectsPerDossier,
      position_range: `${posStart}–${posEnd}`,
      status,
    });
  }

  return dossiers;
}

/**
 * Validates whether a box can be closed according to business rules:
 * A box cannot be closed until all required dossiers and projects are complete
 * and all required records are resolved.
 */
export function evaluateBoxClosure(
  box: Box,
  projects: Project[]
): {
  canClose: boolean;
  blockingReasons: string[];
  stats: {
    totalExpected: number;
    totalRegistered: number;
    completed: number;
    missing: number;
    pending: number;
    inProgress: number;
    onHold: number;
    readyForDelivery: number;
    delivered: number;
  };
} {
  const boxProjects = projects.filter((p) => p.box_number === box.box_number);
  const totalExpected = box.capacity;
  const totalRegistered = boxProjects.length;

  const completed = boxProjects.filter((p) => p.status === 'Completed').length;
  const delivered = boxProjects.filter((p) => p.status === 'Delivered').length;
  const readyForDelivery = boxProjects.filter((p) => p.status === 'Ready for Delivery').length;
  const missing = boxProjects.filter((p) => p.status === 'Missing').length;
  const pending = boxProjects.filter((p) => p.status === 'Pending').length;
  const inProgress = boxProjects.filter((p) => p.status === 'In Progress').length;
  const onHold = boxProjects.filter((p) => p.status === 'On Hold').length;

  const blockingReasons: string[] = [];

  const unarchivedCount = totalExpected - (completed + delivered + readyForDelivery);

  if (pending > 0) {
    blockingReasons.push(`${pending} project(s) are still Pending archive processing.`);
  }
  if (inProgress > 0) {
    blockingReasons.push(`${inProgress} project(s) are currently In Progress.`);
  }
  if (onHold > 0) {
    blockingReasons.push(`${onHold} project(s) are marked On Hold.`);
  }
  if (missing > 0) {
    blockingReasons.push(`${missing} project(s) are flagged as Missing in the archive.`);
  }
  if (totalRegistered < totalExpected) {
    blockingReasons.push(
      `${totalExpected - totalRegistered} expected slot(s) have not been registered from imported data (${totalRegistered}/${totalExpected}).`
    );
  }

  const canClose = blockingReasons.length === 0;

  return {
    canClose,
    blockingReasons,
    stats: {
      totalExpected,
      totalRegistered,
      completed,
      missing,
      pending,
      inProgress,
      onHold,
      readyForDelivery,
      delivered,
    },
  };
}

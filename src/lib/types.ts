export const STAGE_TYPES = ["LEAGUE", "KNOCKOUT", "GROUPS"] as const;
export type StageType = (typeof STAGE_TYPES)[number];

export const MATCH_STATUSES = ["scheduled", "live", "finished"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export type StageConfig = {
  pointsWin?: number;
  pointsDraw?: number;
  pointsLoss?: number;
  groupSize?: number;
  advancePerGroup?: number;
  /** Set on a knockout stage generated from a preceding group stage. */
  seededFromStageId?: string;
};

export function stageConfig(raw: unknown): StageConfig {
  if (!raw || typeof raw !== "object") return {};
  return raw as StageConfig;
}

export function pointsFromConfig(config: StageConfig) {
  return {
    pointsWin: config.pointsWin ?? 3,
    pointsDraw: config.pointsDraw ?? 1,
    pointsLoss: config.pointsLoss ?? 0,
  };
}

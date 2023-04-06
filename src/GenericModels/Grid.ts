import { randomIntInRange } from '../GenericGame/Utils';
import Color from './Color';

export type GridPosition = {
  row: number;
  column: number;
};

export type GridSize = {
  rowCount: number;
  columnCount: number;
};

export function GridPositionEqual(a: GridPosition, b: GridPosition) {
  return a.row === b.row && a.column === b.column;
}

export function GridPositionsManhattanDistance(
  a: GridPosition,
  b: GridPosition
) {
  return Math.abs(a.row - b.row) + Math.abs(a.column - b.column);
}

export function GridPositionsEuclideanDistance(
  a: GridPosition,
  b: GridPosition
) {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.column - b.column);
  return Math.sqrt(dr * dr + dc * dc);
}

export function GridPositionGenerateRandom(
  rowCount: number,
  columnCount: number
): GridPosition {
  return {
    row: randomIntInRange(0, rowCount),
    column: randomIntInRange(0, columnCount),
  };
}

export type GridBackground =
  | { mode: 'fill'; color: Color }
  | { mode: 'checker'; aColor: Color; bColor: Color }
  | { mode: 'custom'; colorer: (pos: GridPosition) => Color };

export type GridBorder = {
  lineColor: Color;
  lineWidth: number;
  style?: 'solid' | 'dashed';
};

import Color from '../GenericModels/Color';
import { GridPosition, GridSize } from '../GenericModels/Grid';
import Rect from '../GenericModels/Rect';
import Vec2 from '../GenericModels/Vec2';
import { ICanvas, TextAttributes } from './ICanvas';
import { clamp } from './Utils';

export type GridRenderConfig = {
  origin: Vec2;
  cellSize: Vec2;
  background: GridBackground;
  border: GridBorder;
};

const defaultConfig: GridRenderConfig = {
  origin: Vec2.zero,
  cellSize: new Vec2(20, 20),
  background: {
    mode: 'checker',
    aColor: Color.white,
    bColor: Color.black,
  },
  border: {
    lineColor: Color.grey(),
    lineWidth: 0,
    style: 'solid',
  },
};

export type GridBackground =
  | { mode: 'fill'; color: Color }
  | { mode: 'checker'; aColor: Color; bColor: Color }
  | { mode: 'custom'; colorer: (pos: GridPosition) => Color };

export type GridBorder = {
  lineColor: Color;
  lineWidth: number;
  style?: 'solid' | 'dashed';
};

export type PositionInCell = {
  cellPos: GridPosition;
  normalizedOffset: Vec2;
};

export default class GridRenderer {
  #gridSize: GridSize;
  #config: GridRenderConfig;

  constructor(
    gridSize: GridSize,
    canvas: ICanvas,
    config: Partial<GridRenderConfig>
  ) {
    this.#config = { ...defaultConfig, ...config };
    this.#gridSize = gridSize;
    canvas.size = this.totalSize();
  }

  get rowCount(): number {
    return this.#gridSize.rowCount;
  }

  get columnCount(): number {
    return this.#gridSize.columnCount;
  }

  get cellSize(): Vec2 {
    return Object.assign({}, this.#config.cellSize);
  }

  get midpoint() {
    return this.rect.midpoint;
  }

  set midpoint(m: Vec2) {
    this.#config.origin = m.sub(this.totalSize().mul(0.5));
  }

  public get rect(): Rect {
    return new Rect(this.#config.origin, this.totalSize());
  }

  totalSize(): Vec2 {
    const { cellSize } = this.#config;
    const lineWidth = this.#config.border.lineWidth;
    const width =
      cellSize.x * this.columnCount + lineWidth * (this.columnCount + 1);
    const height = cellSize.y * this.rowCount + lineWidth * (this.rowCount + 1);

    return new Vec2(width, height);
  }

  render(canvas: ICanvas) {
    const { background, border, origin } = this.#config;
    const totalSize = this.totalSize();

    if (background) {
      if (background.mode === 'fill') {
        canvas.drawRect({ origin, size: totalSize, color: background.color });
      } else {
        this.forEachCell((cellPos, rect) => {
          const color =
            background.mode === 'checker'
              ? (cellPos.row + cellPos.column) % 2
                ? background.aColor
                : background.bColor
              : background.colorer(cellPos);
          canvas.drawRect({ origin: rect.origin, size: rect.size, color });
        });
      }
    }

    if (border && border.lineWidth > 0) {
      const { lineWidth, lineColor } = border;
      const shift = new Vec2(-lineWidth / 2, -lineWidth / 2);

      const lineDash = border.style === 'dashed' ? [lineWidth * 2] : [];

      for (let column = 0; column <= this.columnCount; column++) {
        const p = this.cellContentRectAtPosition({
          row: 0,
          column,
        }).origin.add(shift);
        canvas.drawLine({
          start: p,
          end: p.mapY((y) => y + totalSize.y),
          color: lineColor,
          thickness: lineWidth,
          lineDash,
        });
      }

      for (let row = 0; row <= this.rowCount; row++) {
        const p = this.cellContentRectAtPosition({
          row,
          column: 0,
        }).origin.add(shift);
        canvas.drawLine({
          start: p,
          end: p.mapX((x) => x + totalSize.x),
          color: lineColor,
          thickness: lineWidth,
          lineDash,
        });
      }
    }
  }

  forEachCell(fn: (cellPos: GridPosition, rect: Rect, idx: number) => void) {
    for (let column = 0; column < this.columnCount; column++) {
      for (let row = 0; row < this.rowCount; row++) {
        const cellPos = { row, column };
        fn(
          cellPos,
          this.cellContentRectAtPosition(cellPos),
          row * this.columnCount + column
        );
      }
    }
  }

  // DRAWING -------------------------------------

  fillCell(canvas: ICanvas, cellPos: GridPosition, color: Color) {
    const rect = this.cellContentRectAtPosition(cellPos);
    canvas.drawRect({ origin: rect.origin, size: rect.size, color });
  }

  drawText(
    canvas: ICanvas,
    text: string,
    positionInCell: PositionInCell,
    attributes: TextAttributes,
    normalizedAnchorOffset?: {
      offsetX?: number;
      offsetY?: number | 'baseline';
    }
  ) {
    const position = this.#screenPositionAtPositionInCell(positionInCell);
    canvas.drawText({ text, position, attributes, normalizedAnchorOffset });
  }

  drawLine(
    canvas: ICanvas,
    start: PositionInCell,
    end: PositionInCell,
    color: Color,
    thickness: number = 1
  ) {
    canvas.drawLine({
      start: this.#screenPositionAtPositionInCell(start),
      end: this.#screenPositionAtPositionInCell(end),
      color,
      thickness,
    });
  }

  drawEllipseInCell(
    canvas: ICanvas,
    positionInCell: PositionInCell,
    color: Color,
    fillPercent?: Vec2,
    rotationAngle?: number
  ) {
    const {
      size: { x: cellWidth, y: cellHeight },
    } = this.cellContentRectAtPosition(positionInCell.cellPos);

    const rx = (cellWidth / 2) * (fillPercent?.x ?? 1);
    const ry = (cellHeight / 2) * (fillPercent?.y ?? 1);
    const origin = this.#screenPositionAtPositionInCell(positionInCell);
    canvas.drawEllipse({ origin, rx, ry, color, rotationAngle });
  }

  // GridPosition Convertions -------------------------------------

  cellAtPosition(pos: Vec2): GridPosition {
    const { origin, cellSize } = this.#config;
    const lineWidth = this.#config.border.lineWidth;
    const { x, y } = pos.sub(origin);

    const c = x / (cellSize.x + lineWidth);
    const r = y / (cellSize.y + lineWidth);

    const column = clamp(Math.floor(c), {
      min: 0,
      max: this.#gridSize.columnCount - 1,
    });
    const row = clamp(Math.floor(r), {
      min: 0,
      max: this.#gridSize.rowCount - 1,
    });
    return { column, row };
  }

  cellContentRectAtPosition(cellPos: GridPosition): Rect {
    const { cellSize } = this.#config;
    const lineWidth = this.#config.border.lineWidth;

    const offset = new Vec2(
      (cellSize.x + lineWidth) * cellPos.column,
      (cellSize.y + lineWidth) * cellPos.row
    );
    const cellOrigin = this.#cellContentOrigin();
    return new Rect(cellOrigin.add(offset), cellSize);
  }

  #cellContentOrigin(): Vec2 {
    const { border, origin } = this.#config;

    const d = border.lineWidth;
    return origin.add(new Vec2(d, d));
  }

  #screenPositionAtPositionInCell(positionInCell: PositionInCell): Vec2 {
    const { cellPos, normalizedOffset } = positionInCell;
    const rect = this.cellContentRectAtPosition(cellPos);
    const { size } = rect;

    return rect.midpoint.add(
      new Vec2(
        (normalizedOffset.x * size.x) / 2,
        (normalizedOffset.y * size.y) / 2
      )
    );
  }
}

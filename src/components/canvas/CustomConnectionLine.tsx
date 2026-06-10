import {
  BaseEdge,
  getBezierPath,
  type ConnectionLineComponentProps,
} from "@xyflow/react";

const STROKE = {
  invalid: "#e53935",
  valid: "var(--handle-color)",
  neutral: "var(--edge-stroke)",
} as const;

export function CustomConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
  connectionStatus,
}: ConnectionLineComponentProps) {
  const [path] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
    sourcePosition: fromPosition,
    targetPosition: toPosition,
  });

  const stroke =
    connectionStatus === "invalid"
      ? STROKE.invalid
      : connectionStatus === "valid"
        ? STROKE.valid
        : STROKE.neutral;

  return (
    <BaseEdge
      path={path}
      style={{
        stroke,
        strokeWidth: connectionStatus === "invalid" ? 2.5 : 2,
        strokeDasharray: connectionStatus === "invalid" ? "6 4" : undefined,
      }}
    />
  );
}

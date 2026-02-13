/**
 * Displays the vision, mission, and core problem statement.
 */

import type { Vision } from "../domain/requirements/requirement";

export interface VisionHeaderProps {
  vision: Vision | null;
}

export function VisionHeader({ vision }: VisionHeaderProps) {
  if (!vision) {
    return null;
  }

  return (
    <section
      className="mb-8 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-6"
      data-testid="vision-header"
    >
      <h2 className="mb-4 text-lg font-bold text-indigo-900">Vision &amp; Mission</h2>

      <div className="space-y-3">
        <div data-testid="vision-field">
          <span className="text-xs font-semibold tracking-wide text-indigo-500 uppercase">
            Vision
          </span>
          <p className="mt-0.5 text-sm leading-relaxed text-gray-800">
            {vision.vision}
          </p>
        </div>

        <div data-testid="mission-field">
          <span className="text-xs font-semibold tracking-wide text-indigo-500 uppercase">
            Mission
          </span>
          <p className="mt-0.5 text-sm leading-relaxed text-gray-800">
            {vision.mission}
          </p>
        </div>

        <div data-testid="problem-field">
          <span className="text-xs font-semibold tracking-wide text-indigo-500 uppercase">
            Core Problem
          </span>
          <p className="mt-0.5 text-sm leading-relaxed text-gray-800">
            {vision.problem}
          </p>
        </div>
      </div>
    </section>
  );
}

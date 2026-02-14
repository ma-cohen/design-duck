/**
 * Compact clickable card that summarises a playground.
 * Shown on the home view in the Playgrounds section; clicking drills into the full playground detail.
 */

import type { PlaygroundRequirements, ProjectDesign } from "../domain/requirements/requirement";

export interface PlaygroundCardProps {
  playgroundName: string;
  playground: PlaygroundRequirements;
  design?: ProjectDesign | null;
  onClick: () => void;
}

export function PlaygroundCard({ playgroundName, playground, design, onClick }: PlaygroundCardProps) {
  const reqCount = playground.requirements.length;
  const decisionCount = design?.decisions.length ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full cursor-pointer rounded-xl border border-slate-600 bg-slate-700 p-6 text-left shadow-sm transition-all hover:border-amber-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-800"
      data-testid={`playground-card-${playgroundName}`}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-300">
          Playground
        </span>
        <h3 className="text-lg font-bold text-slate-50 group-hover:text-amber-400 transition-colors">
          {playgroundName}
        </h3>
      </div>

      <p className="mt-2 line-clamp-2 text-base leading-relaxed text-slate-300 italic">
        {playground.problemStatement}
      </p>

      <div className="mt-5 flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-950 px-3 py-1 text-sm font-medium text-blue-200">
          {reqCount} requirement{reqCount !== 1 ? "s" : ""}
        </span>
        {decisionCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-950 px-3 py-1 text-sm font-medium text-purple-200">
            {decisionCount} decision{decisionCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </button>
  );
}

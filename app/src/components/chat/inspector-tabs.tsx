"use client";

import { useRef, type KeyboardEvent } from "react";
import { useStreamSelector } from "@/components/chat/open-intelligent-ui/chat-shell";
import { cn } from "@/lib/utils";

export type InspectorTabKey = "plan" | "run";

export function InspectorTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: InspectorTabKey;
  onTabChange: (tab: InspectorTabKey) => void;
}) {
  const planTabRef = useRef<HTMLButtonElement>(null);
  const runTabRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      if (activeTab === "run") {
        onTabChange("plan");
        planTabRef.current?.focus();
      } else {
        onTabChange("run");
        runTabRef.current?.focus();
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      onTabChange("plan");
      planTabRef.current?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      onTabChange("run");
      runTabRef.current?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Run panel"
      data-testid="inspector-tabs"
      className="flex items-center gap-1 border-b border-[#E5E5E5]"
      onKeyDown={handleKeyDown}
    >
      <button
        ref={planTabRef}
        type="button"
        role="tab"
        id="inspector-tab-plan"
        aria-selected={activeTab === "plan"}
        aria-controls="inspector-panel-plan"
        tabIndex={activeTab === "plan" ? 0 : -1}
        data-testid="inspector-tab-plan"
        onClick={() => onTabChange("plan")}
        className={cn(
          "relative -mb-[1px] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#F9F9F9] focus-visible:outline-2 focus-visible:outline-ring",
          activeTab === "plan"
            ? "border-b-2 border-[#0D0D0D] text-[#0D0D0D]"
            : "border-b-2 border-transparent text-[#737373]"
        )}
      >
        Plan
      </button>
      <button
        ref={runTabRef}
        type="button"
        role="tab"
        id="inspector-tab-run"
        aria-selected={activeTab === "run"}
        aria-controls="inspector-panel-run"
        tabIndex={activeTab === "run" ? 0 : -1}
        data-testid="inspector-tab-run"
        onClick={() => onTabChange("run")}
        className={cn(
          "relative -mb-[1px] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#F9F9F9] focus-visible:outline-2 focus-visible:outline-ring",
          activeTab === "run"
            ? "border-b-2 border-[#0D0D0D] text-[#0D0D0D]"
            : "border-b-2 border-transparent text-[#737373]"
        )}
      >
        Run
      </button>
    </div>
  );
}

export function InspectorPlanPanel() {
  const plan = useStreamSelector((s) => s.plan);
  const statusLogsLength = useStreamSelector((s) => s.od?.statusLogs?.length ?? 0);
  void statusLogsLength;

  const hasPlan = Boolean(
    plan && ((plan.objective && plan.objective.trim().length > 0) || (plan.steps && plan.steps.length > 0))
  );

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-surface p-3" data-testid="inspector-plan">
      <h2 className="mb-2 text-sm font-semibold text-[#0D0D0D]">Plan</h2>
      {!hasPlan ? (
        <p className="text-xs text-[#737373]" data-testid="plan-empty-state">
          No plan for this run yet — the planner&apos;s steps appear here while a run streams.
        </p>
      ) : (
        <div className="space-y-2">
          {plan?.objective && (
            <p className="text-xs font-medium text-[#0D0D0D]" data-testid="inspector-plan-objective">
              {plan.objective}
            </p>
          )}
          {plan?.steps && plan.steps.length > 0 && (
            <ol className="space-y-1.5 text-xs" data-testid="inspector-plan-steps">
              {plan.steps.map((step, idx) => (
                <li key={step.id || idx} className="flex items-start gap-2" data-testid="inspector-plan-step">
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      step.state === "done" && "bg-[#0D0D0D]",
                      step.state === "running" && "bg-[#2563EB] animate-pulse",
                      step.state === "failed" && "bg-[#DC2626]",
                      step.state === "pending" && "bg-[#D4D4D4]"
                    )}
                    aria-hidden
                  />
                  <span className="flex-1 text-[#0D0D0D]">{step.title}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

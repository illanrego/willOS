#!/usr/bin/env python3
"""Static checks for the Startpage Planner surface."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def require(text: str, needle: str, source: str) -> None:
    if needle not in text:
        raise AssertionError(f"missing {needle!r} in {source}")


def test_planner_html_surface() -> None:
    html = read("index.html")
    for needle in [
        'id="plannerIconDiv"',
        "hideQuadro('plannerContainer')",
        'id="plannerContainer"',
        'id="plannerPanel"',
        'id="plannerTitleInput"',
        'id="plannerSummaryInput"',
        'id="plannerSendTodaySelect"',
        'id="plannerSendTodayBtn"',
        'id="plannerMilestonesList"',
        'id="plannerMilestoneInput"',
        'id="plannerMilestoneAddBtn"',
        'id="plannerSprintTitleInput"',
        'id="plannerSprintFocusInput"',
        'id="plannerSprintPlannedInput"',
        'id="plannerSprintResultInput"',
        'id="plannerSprintNotesInput"',
        'id="plannerCloseSprintBtn"',
        'id="plannerSprintLog"',
        ">Planner<",
    ]:
        require(html, needle, "index.html")


def test_planner_logic_hooks() -> None:
    js = read("startpage.js")
    for needle in [
        'const PLANNER_STORAGE_KEY = "plannerState";',
        'const PLANNER_IMPORT_SCOPE = "planner_v1";',
        "function defaultPlannerState()",
        "function normalizePlannerState(",
        "function getPlannerState()",
        "function setPlannerState(",
        "async function loadPlannerBackendState()",
        "async function savePlanner()",
        "function renderPlanner()",
        "function renderPlannerMilestones(",
        "function addPlannerMilestone(",
        "function togglePlannerMilestone(",
        "function removePlannerMilestone(",
        "function renderPlannerSprintLog(",
        "function closePlannerSprint(",
        "function defaultPlannerSprint(",
        "activeSprint",
        "sprintLog",
        "function sendPlannerBlockToToday()",
        'plannerRemoteState.loaded = false',
        'from("planner_plans")',
        "renderPlanner();",
        'draggable("plannerContainer");',
        'makeResizable("plannerContainer",',
    ]:
        require(js, needle, "startpage.js")


def test_planner_styles() -> None:
    css = read("startpage.css")
    for needle in [
        "#plannerContainer",
        "#plannerPanel",
        ".planner-lanes",
        ".planner-lane-card",
        ".planner-status-card",
        ".planner-form-grid",
        ".planner-sprint-grid",
        ".planner-sprint-log",
        ".planner-sprint-log-item",
        ".planner-milestone-block",
        ".planner-milestone-list",
        ".planner-milestone-item",
        ".planner-milestone-item--done",
        ".planner-milestone-add",
    ]:
        require(css, needle, "startpage.css")


def test_planner_migration() -> None:
    migration = read("supabase/migrations/20260831000000_planner.sql")
    for needle in [
        "create table if not exists public.planner_plans",
        "milestones jsonb not null default '[]'::jsonb",
        "weekly_blocks jsonb not null default '[]'::jsonb",
        "sprints jsonb not null",
        "status text not null default 'active'",
        "enable row level security",
        "planner_plans_all_own",
    ]:
        require(migration, needle, "supabase/migrations/20260831000000_planner.sql")


def main() -> None:
    tests = [
        test_planner_html_surface,
        test_planner_logic_hooks,
        test_planner_styles,
        test_planner_migration,
    ]
    for test in tests:
        test()
    print(f"planner static checks passed ({len(tests)} tests)")


if __name__ == "__main__":
    main()

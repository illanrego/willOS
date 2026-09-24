"""Behaviour tests for the one-time migration of the old Supabase rows."""

import json
import os
import tempfile
import unittest
from pathlib import Path

from willcli import finance, importer, notes, planner, routine, skills, tasks


class ImporterTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        os.environ["WILL_STORE"] = str(Path(self.tmp.name) / "store")
        os.environ["WILL_DATA_DIR"] = str(Path(self.tmp.name) / "data")

    def tearDown(self):
        for key in ("WILL_STORE", "WILL_DATA_DIR"):
            os.environ.pop(key, None)

    def run_import(self, payload):
        path = Path(self.tmp.name) / "legacy.json"
        path.write_text(json.dumps(payload), encoding="utf-8")
        return importer.run(path)

    def test_column_names_are_tolerant(self):
        self.assertEqual(importer.pick({"text": "hi"}, "text", "title"), "hi")
        self.assertEqual(importer.pick({"TITLE": "hi"}, "title"), "hi")
        self.assertEqual(importer.pick({"title": ""}, "title", default="fallback"), "fallback")
        self.assertEqual(importer.day_of("2026-09-24T10:00:00+00:00"), "2026-09-24")
        self.assertEqual(importer.day_of(None), "")

    def test_dailies_become_routines_and_todos_become_tasks(self):
        report = self.run_import(
            {
                "tasks": [
                    {"text": "Morning operator", "task_type": "daily", "daily_done_on": "2026-09-24"},
                    {"text": "Buy cat food", "task_type": "todo"},
                    {"text": "Already finished", "task_type": "todo", "completed_at": "2026-09-20T10:00:00+00:00"},
                    {"text": "", "task_type": "todo"},
                ]
            }
        )
        self.assertEqual(report["routine"], 1)
        self.assertEqual(report["tasks"], 2)

        routines = {row["code"]: row for row in routine.summary(routine.load(), "2026-09-24")}
        self.assertTrue(routines["morning-operator"]["done_today"])

        payload = tasks.load()
        texts = {task["text"]: task["state"] for task in payload["tasks"]}
        self.assertEqual(texts["Buy cat food"], "todo")
        self.assertEqual(texts["Already finished"], "done")
        self.assertNotIn("", texts)
        self.assertIn("tasks", report["_stores"])

    def test_trackers_and_daily_values_become_skills(self):
        self.run_import(
            {
                "trackers": [
                    {"id": "t1", "code": "coding", "label": "Coding"},
                    {"id": "t2", "code": "standup", "label": "Stand Up"},
                ],
                "tracker_daily_values": [
                    {"tracker_id": "t1", "tracked_on": "2026-09-24", "value": 2},
                    {"tracker_id": "t2", "tracked_on": "2026-09-24", "value": 1},
                    {"tracker_id": "t1", "tracked_on": "2026-09-23", "value": 0},
                    {"tracker_id": "gone", "tracked_on": "2026-09-24", "value": 5},
                ],
            }
        )
        payload = skills.load()
        rows = {row["code"]: row for row in skills.summary(payload, "2026-09-24")}
        self.assertEqual(rows["coding"]["today"], 2)
        self.assertEqual(rows["standup"]["total"], 1)
        self.assertEqual(rows["coding"]["days"], {"2026-09-24": 2})

    def test_kanban_cards_take_the_column_state(self):
        self.run_import(
            {
                "kanban_columns": [
                    {"id": "c1", "code": "todo", "title": "To do"},
                    {"id": "c2", "code": "wip", "title": "Doing"},
                    {"id": "c3", "code": "shipped", "title": "Done"},
                ],
                "kanban_cards": [
                    {"text": "one", "column_id": "c1"},
                    {"text": "two", "column_id": "c2"},
                    {"text": "three", "column_id": "c3"},
                ],
            }
        )
        states = {task["text"]: task["state"] for task in tasks.load()["tasks"]}
        self.assertEqual(states, {"one": "todo", "two": "doing", "three": "done"})

    def test_plans_finance_and_recommendations_land_in_their_stores(self):
        self.run_import(
            {
                "planner_plans": [
                    {"title": "Course launch", "start_date": "2026-09-20", "end_date": "2026-09-30", "note": "sell"},
                    {"title": "", "start_date": "2026-09-20"},
                ],
                "finance_entries": [
                    {
                        "happened_on": "2026-09-06",
                        "entry_type": "expense",
                        "amount": 149.9,
                        "note": "course",
                        "category": "education",
                    },
                    {"happened_on": "", "entry_type": "income", "amount": None},
                ],
                "recommendations": [{"text": "The Bear"}, {"text": ""}],
            }
        )
        plans = planner.load()["plans"]
        self.assertEqual([plan["title"] for plan in plans], ["Course launch"])
        self.assertEqual(plans[0]["end"], "2026-09-30")

        entries = finance.load()["entries"]
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]["amount_cents"], 14990)
        self.assertEqual(entries[0]["category"], "education")

        lines = [line["text"] for _, line in notes.section_lines(notes.load())]
        self.assertEqual(lines, ["The Bear"])

    def test_unknown_tables_are_reported_not_silently_dropped(self):
        report = self.run_import({"mystery_table": [{"a": 1}], "tasks": [{"text": "x", "task_type": "todo"}]})
        self.assertEqual(report["_skipped"], ["mystery_table"])

    def test_a_bare_array_is_treated_as_notes_rows(self):
        report = self.run_import([{"slug": "vagas", "title": "Vagas", "body": "- frontendbr"}])
        self.assertEqual(report["notes"], 1)


if __name__ == "__main__":
    unittest.main()

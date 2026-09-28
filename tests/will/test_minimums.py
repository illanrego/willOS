"""Weekly minimums: the floor that replaced the per-day obligation flag.

A floor can belong to an activity (`physique`) or to a contentflow lane
(`lane:teacher`, `lane:standup`), because planning sits above both. The lane
scope is what keeps the stand-up lane's floor off the stand-up skill.
"""

import json
import os
import tempfile
import unittest
from pathlib import Path

from willcli import activities, minimums, store


class MinimumsTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        os.environ["WILL_STORE"] = str(Path(self.tmp.name) / "store")
        os.environ["WILL_DATA_DIR"] = str(Path(self.tmp.name) / "data")
        # A throwaway contentflow board: lane resolution reads the real lanes,
        # and a test must never depend on (or disturb) his actual board.
        board = Path(self.tmp.name) / "contentflow"
        board.mkdir(parents=True, exist_ok=True)
        (board / "board.json").write_text(
            json.dumps(
                {
                    "version": 2,
                    "cards": [
                        {"id": index, "lane": lane, "state": "idea"}
                        for index, lane in enumerate(("standup", "comics", "moc", "teacher", "freela"), start=1)
                    ],
                }
            )
        )
        os.environ["CONTENTFLOW_STORE"] = str(board / "board.json")
        self.addCleanup(self._clear_env)

    def _clear_env(self):
        for key in ("WILL_STORE", "WILL_DATA_DIR", "CONTENTFLOW_STORE"):
            os.environ.pop(key, None)


class WeekTest(MinimumsTestCase):
    def test_the_week_runs_monday_to_sunday(self):
        self.assertEqual(minimums.week_days("2026-09-28"), ("2026-09-28", "2026-10-04"))

    def test_a_sunday_belongs_to_the_week_that_started_on_monday(self):
        self.assertEqual(minimums.week_days("2026-09-27"), ("2026-09-21", "2026-09-27"))

    def test_counting_ignores_days_outside_the_week(self):
        days = {"2026-09-20": 5, "2026-09-27": 2, "2026-09-28": 1, "2026-09-29": 3, "2026-10-05": 9}
        self.assertEqual(minimums.count_in_week(days, "2026-09-28"), 4)  # Mon 28th + Tue 29th
        self.assertEqual(minimums.count_in_week(days, "2026-09-27"), 2)  # only the Sunday
        self.assertEqual(minimums.count_in_week({}, "2026-09-28"), 0)


class FloorTest(MinimumsTestCase):
    def test_a_floor_is_set_read_and_cleared(self):
        payload = minimums.load()
        self.assertEqual(minimums.get(payload, "physique"), 0)

        minimums.set_minimum(payload, "Physique", 4)
        self.assertEqual(minimums.get(payload, "physique"), 4)

        minimums.set_minimum(payload, "physique", 0)
        self.assertEqual(minimums.get(payload, "physique"), 0)

    def test_a_content_lane_carries_a_namespaced_floor(self):
        payload = minimums.load()
        minimums.set_minimum(payload, minimums.lane_code("teacher"), 2)
        minimums.set_minimum(payload, minimums.lane_code("moc"), 3)
        self.assertEqual(
            {row["code"]: row["minimum"] for row in minimums.rows(payload)},
            {"lane:moc": 3, "lane:teacher": 2},
        )

    def test_the_lane_and_the_skill_of_the_same_name_are_different_keys(self):
        payload = minimums.load()
        minimums.set_minimum(payload, "standup", 0)
        minimums.set_minimum(payload, minimums.lane_code("standup"), 4)
        self.assertEqual(minimums.get(payload, "standup"), 0)
        self.assertEqual(minimums.get(payload, "lane:standup"), 4)

    def test_an_empty_code_is_an_explicit_error(self):
        with self.assertRaises(SystemExit):
            minimums.set_minimum(minimums.load(), "  ", 3)


class FloorCodeTest(MinimumsTestCase):
    """What he types has to land on the record he meant."""

    def resolve(self, code):
        from willcli import cli
        return cli._resolve_floor_code(code)

    def test_a_lane_only_name_becomes_a_lane_key(self):
        # `teacher` is never a skill, so a bare key would be read by nobody
        self.assertEqual(self.resolve("teacher"), ("lane:teacher", ""))

    def test_an_activity_keeps_its_bare_key(self):
        self.assertEqual(self.resolve("physique"), ("physique", ""))

    def test_a_name_that_is_both_warns_and_keeps_the_skill_meaning(self):
        code, note = self.resolve("standup")
        self.assertEqual(code, "standup")
        self.assertIn("lane:standup", note)

    def test_an_explicit_lane_prefix_is_taken_at_its_word(self):
        self.assertEqual(self.resolve("lane:standup"), ("lane:standup", ""))


class SkillsModelCarriesTheFloorTest(MinimumsTestCase):
    def test_a_lane_floor_does_not_move_the_skill_floor(self):
        """The bug this scope exists to prevent."""
        from willcli import exporter

        payload = minimums.load()
        minimums.set_minimum(payload, minimums.lane_code("standup"), 4)
        store.save("minimums", payload)

        exporter.export_skills()
        exporter.export_content()

        import json
        skills = json.loads((store.data_dir() / "skills.json").read_text())
        row = next(item for item in skills["skills"] if item["code"] == "standup")
        self.assertEqual(row["weekly_minimum"], 0, "the skill must not inherit the lane's floor")

        content = json.loads((store.data_dir() / "content.json").read_text())
        self.assertEqual(content["weekly"]["standup"]["minimum"], 4)

    def test_the_skills_render_model_exports_week_and_floor(self):
        from willcli import exporter

        payload = activities.load()
        activities.record(payload, "standup", amount=1, day=minimums.week_start())
        activities.record(payload, "standup", amount=1, day=minimums.week_start())
        activities.record(payload, "standup", amount=1, day="2000-01-01")  # another week
        store.save("activities", payload)
        floors = minimums.load()
        minimums.set_minimum(floors, "standup", 4)
        store.save("minimums", floors)

        exporter.export_skills()

        import json
        model = json.loads((store.data_dir() / "skills.json").read_text())
        row = next(item for item in model["skills"] if item["code"] == "standup")
        self.assertEqual(row["week"], 2)
        self.assertEqual(row["weekly_minimum"], 4)
        self.assertEqual(model["week"]["start"], minimums.week_start())

    def test_a_skill_without_a_floor_reports_zero(self):
        import json

        from willcli import exporter

        exporter.export_skills()
        model = json.loads((store.data_dir() / "skills.json").read_text())
        row = next(item for item in model["skills"] if item["code"] == "physique")
        self.assertEqual(row["weekly_minimum"], 0)


if __name__ == "__main__":
    unittest.main()

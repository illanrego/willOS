"""Behaviour tests for the will domains: routine, skills, tasks, planner, finance."""

import os
import tempfile
import unittest
from pathlib import Path

from willcli import finance, planner, routine, skills, store, tasks


class DomainTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        os.environ["WILL_STORE"] = str(Path(self.tmp.name) / "store")
        os.environ["WILL_DATA_DIR"] = str(Path(self.tmp.name) / "data")

    def tearDown(self):
        for key in ("WILL_STORE", "WILL_DATA_DIR"):
            os.environ.pop(key, None)


class RoutineTest(DomainTestCase):
    def test_the_store_starts_with_the_two_real_routines(self):
        codes = [row["code"] for row in routine.summary(routine.load())]
        self.assertEqual(codes, ["morning-operator", "job-hunting"])

    def test_ticking_a_routine_marks_today_and_builds_a_streak(self):
        payload = routine.load()
        routine.mark(payload, "morning-operator", "2026-09-22")
        routine.mark(payload, "morning-operator", "2026-09-23")
        routine.mark(payload, "morning-operator", "2026-09-24")

        summary = {row["code"]: row for row in routine.summary(payload, "2026-09-24")}
        self.assertTrue(summary["morning-operator"]["done_today"])
        self.assertEqual(summary["morning-operator"]["streak"], 3)
        self.assertEqual(summary["morning-operator"]["last_done_on"], "2026-09-24")

    def test_a_missed_day_breaks_the_streak(self):
        payload = routine.load()
        routine.mark(payload, "morning-operator", "2026-09-20")
        routine.mark(payload, "morning-operator", "2026-09-24")
        self.assertEqual(routine.streak(routine.find(payload, "morning-operator"), "2026-09-24"), 1)

    def test_a_streak_counts_yesterday_when_today_is_not_ticked_yet(self):
        payload = routine.load()
        routine.mark(payload, "job-hunting", "2026-09-23")
        self.assertEqual(routine.streak(routine.find(payload, "job-hunting"), "2026-09-24"), 1)

    def test_ticking_twice_on_the_same_day_is_idempotent(self):
        payload = routine.load()
        routine.mark(payload, "morning-operator", "2026-09-24")
        routine.mark(payload, "morning-operator", "2026-09-24")
        self.assertEqual(routine.find(payload, "morning-operator")["days"], ["2026-09-24"])

    def test_unticking_removes_the_day(self):
        payload = routine.load()
        routine.mark(payload, "morning-operator", "2026-09-24")
        routine.mark(payload, "morning-operator", "2026-09-24", done=False)
        self.assertEqual(routine.find(payload, "morning-operator")["days"], [])

    def test_an_unknown_routine_is_an_explicit_error(self):
        with self.assertRaises(SystemExit):
            routine.mark(routine.load(), "nope")

    def test_month_count_only_counts_the_current_month(self):
        payload = routine.load()
        routine.mark(payload, "morning-operator", "2026-08-31")
        routine.mark(payload, "morning-operator", "2026-09-01")
        routine.mark(payload, "morning-operator", "2026-09-02")
        summary = {row["code"]: row for row in routine.summary(payload, "2026-09-02")}
        self.assertEqual(summary["morning-operator"]["month_count"], 2)


class SkillTest(DomainTestCase):
    def test_a_bump_records_today_and_totals(self):
        payload = skills.load()
        skills.bump(payload, "coding", 3, "2026-09-24")
        skills.bump(payload, "coding", 2, "2026-09-24")
        entry = skills.find(payload, "coding")
        self.assertEqual(entry["days"], {"2026-09-24": 5})
        self.assertEqual(skills.total(entry), 5)

    def test_bumping_below_zero_drops_the_day(self):
        payload = skills.load()
        skills.bump(payload, "coding", 1, "2026-09-24")
        _, value = skills.bump(payload, "coding", -1, "2026-09-24")
        self.assertEqual(value, 0)
        self.assertEqual(skills.find(payload, "coding")["days"], {})

    def test_streaks_ignore_days_with_zero(self):
        payload = skills.load()
        skills.bump(payload, "standup", 1, "2026-09-22")
        skills.bump(payload, "standup", 1, "2026-09-23")
        skills.bump(payload, "standup", 1, "2026-09-24")
        entry = skills.find(payload, "standup")
        self.assertEqual(skills.streak(entry, "2026-09-24"), 3)

    def test_an_unknown_skill_is_an_explicit_error(self):
        with self.assertRaises(SystemExit):
            skills.bump(skills.load(), "nope")

    def test_summary_reports_today_month_and_total(self):
        payload = skills.load()
        skills.bump(payload, "coding", 2, "2026-09-10")
        skills.bump(payload, "coding", 1, "2026-09-24")
        row = {item["code"]: item for item in skills.summary(payload, "2026-09-24")}["coding"]
        self.assertEqual((row["today"], row["month_total"], row["total"]), (1, 3, 3))


class TaskTest(DomainTestCase):
    def test_a_new_task_lands_in_todo(self):
        task = tasks.add(tasks.load(), "write the notes window")
        self.assertEqual(task["state"], "todo")
        self.assertEqual(task["id"], 1)

    def test_state_transitions_stamp_done_at(self):
        payload = tasks.load()
        task = tasks.add(payload, "ship it")
        tasks.set_state(payload, task["id"], "doing")
        self.assertEqual(tasks.find(payload, task["id"])["done_at"], "")
        tasks.set_state(payload, task["id"], "done")
        self.assertTrue(tasks.find(payload, task["id"])["done_at"])

    def test_an_unknown_state_falls_back_to_todo(self):
        self.assertEqual(tasks.normalize_state("nonsense"), "todo")
        self.assertEqual(tasks.normalize_state(""), "todo")

    def test_grouping_and_counts(self):
        payload = tasks.load()
        tasks.add(payload, "one")
        tasks.add(payload, "two", state="doing")
        tasks.add(payload, "three", state="done")
        summary = tasks.summary(payload)
        self.assertEqual(summary["open"], 2)
        self.assertEqual(summary["counts"]["done"], 1)
        self.assertEqual([task["text"] for task in summary["columns"]["doing"]], ["two"])

    def test_removing_an_unknown_task_errors(self):
        with self.assertRaises(SystemExit):
            tasks.remove(tasks.load(), 99)


class PlannerTest(DomainTestCase):
    def test_a_plan_needs_a_title_and_an_ordered_range(self):
        with self.assertRaises(SystemExit):
            planner.add(planner.load(), "  ", "2026-09-24")
        with self.assertRaises(SystemExit):
            planner.add(planner.load(), "week off", "2026-09-24", "2026-09-20")

    def test_summary_buckets_current_upcoming_and_past(self):
        payload = planner.load()
        planner.add(payload, "now", "2026-09-20", "2026-09-30")
        planner.add(payload, "later", "2026-10-05", "2026-10-06")
        planner.add(payload, "before", "2026-09-01", "2026-09-02")
        summary = planner.summary(payload, "2026-09-24")
        self.assertEqual([plan["title"] for plan in summary["current"]], ["now"])
        self.assertEqual([plan["title"] for plan in summary["upcoming"]], ["later"])
        self.assertEqual([plan["title"] for plan in summary["past"]], ["before"])


class FinanceTest(DomainTestCase):
    def test_amounts_are_parsed_to_cents(self):
        self.assertEqual(finance.to_cents("149,90"), 14990)
        self.assertEqual(finance.to_cents("149.90"), 14990)
        self.assertEqual(finance.to_cents("R$ 1.234,56"), 123456)
        with self.assertRaises(SystemExit):
            finance.to_cents("abc")

    def test_month_totals_split_income_and_expense(self):
        payload = finance.load()
        finance.add(payload, "1500,00", kind="income", day="2026-09-05")
        finance.add(payload, "149,90", kind="expense", category="course", day="2026-09-06")
        finance.add(payload, "10", kind="expense", day="2026-08-31")
        totals = finance.month_totals(payload, "2026-09")
        self.assertEqual(totals["income_cents"], 150000)
        self.assertEqual(totals["expense_cents"], 14990)
        self.assertEqual(totals["net_cents"], 135010)
        self.assertEqual(totals["count"], 2)

    def test_an_unknown_kind_falls_back_to_expense(self):
        entry = finance.add(finance.load(), "10", kind="banana")
        self.assertEqual(entry["kind"], "expense")

    def test_summary_groups_expenses_by_category_and_keeps_recent_entries(self):
        payload = finance.load()
        finance.add(payload, "100", category="food", day="2026-09-02")
        finance.add(payload, "50", category="food", day="2026-09-03")
        finance.add(payload, "20", category="bus", day="2026-09-04")
        summary = finance.summary(payload, "2026-09")
        self.assertEqual(summary["categories"], {"food": 15000, "bus": 2000})
        self.assertEqual(summary["recent"][0]["date"], "2026-09-04")
        self.assertEqual(summary["months"]["2026-09"]["count"], 3)

    def test_the_store_round_trips(self):
        payload = finance.load()
        finance.add(payload, "42,42")
        store.save("finance", payload)
        self.assertEqual(finance.load()["entries"][0]["amount_cents"], 4242)


if __name__ == "__main__":
    unittest.main()

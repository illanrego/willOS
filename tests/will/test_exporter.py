"""Behaviour tests for the render-model exporters (the CLI side of every window)."""

import json
import os
import tempfile
import unittest
from pathlib import Path

from willcli import exporter, notes, store


class ExporterTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        os.environ["WILL_STORE"] = str(Path(self.tmp.name) / "store")
        os.environ["WILL_DATA_DIR"] = str(Path(self.tmp.name) / "data")

    def tearDown(self):
        for key in ("WILL_STORE", "WILL_DATA_DIR", "CONTENTFLOW_STORE"):
            os.environ.pop(key, None)

    def model(self, name):
        return json.loads((Path(os.environ["WILL_DATA_DIR"]) / f"{name}.json").read_text(encoding="utf-8"))


class ContentModelTest(ExporterTestCase):
    def card(self, **overrides):
        card = {
            "id": 1,
            "title": "A situação do centro de BH",
            "lane": "standup",
            "kind": "short",
            "state": "rendered",
            "updated_at": "2026-09-20T12:00:00+00:00",
            "events": [],
        }
        card.update(overrides)
        return card

    def test_the_live_day_comes_from_the_event_log_in_local_time(self):
        card = self.card(
            state="posted",
            events=[
                {"at": "2026-09-18T10:00:00+00:00", "action": "moved", "detail": "uploaded -> posted"},
            ],
        )
        # 10:00 UTC on the 18th is 07:00 local on the 18th.
        self.assertEqual(exporter.live_day(card), "2026-09-18")

    def test_a_late_night_utc_event_lands_on_the_local_previous_day(self):
        card = self.card(
            state="posted",
            events=[
                {"at": "2026-09-19T01:30:00+00:00", "action": "moved", "detail": "uploaded -> posted"},
            ],
        )
        # 01:30 UTC on the 19th is 22:30 local on the 18th.
        self.assertEqual(exporter.live_day(card), "2026-09-18")

    def test_the_first_live_transition_wins(self):
        card = self.card(
            state="published",
            events=[
                {"at": "2026-09-20T12:00:00+00:00", "action": "moved", "detail": "editing -> published"},
                {"at": "2026-09-14T12:00:00+00:00", "action": "moved", "detail": "recorded -> published"},
            ],
        )
        self.assertEqual(exporter.live_day(card), "2026-09-14")

    def test_a_closed_card_still_counts(self):
        card = self.card(state="done", events=[{"at": "2026-09-15T12:00:00+00:00", "detail": "review -> delivered"}])
        self.assertEqual(exporter.live_day(card), "2026-09-15")

    def test_cards_that_never_went_live_have_no_day(self):
        self.assertEqual(exporter.live_day(self.card(state="idea", events=[])), "")
        self.assertEqual(exporter.live_day(self.card(state="rendered", events=[{"at": "", "detail": "-> nope"}])), "")

    def test_days_count_posts_per_lane(self):
        cards = [
            self.card(id=1, lane="standup", state="posted", events=[{"at": "2026-09-14T12:00:00+00:00", "detail": "-> posted"}]),
            self.card(id=2, lane="standup", state="posted", events=[{"at": "2026-09-14T18:00:00+00:00", "detail": "-> posted"}]),
            self.card(id=3, lane="moc", state="published", events=[{"at": "2026-09-14T12:00:00+00:00", "detail": "-> published"}]),
        ]
        model = exporter.build_content_model(cards)
        self.assertEqual(model["days"]["2026-09-14"], {"standup": 2, "moc": 1})

    def test_in_flight_excludes_closed_cards_and_hides_titles_by_default(self):
        cards = [
            self.card(id=1, state="rendered"),
            self.card(id=2, state="done"),
            self.card(id=3, state="skipped"),
        ]
        model = exporter.build_content_model(cards)
        self.assertEqual([card["id"] for card in model["cards"]], [1])
        self.assertNotIn("title", model["cards"][0])
        with_titles = exporter.build_content_model(cards, with_titles=True)
        self.assertEqual(with_titles["cards"][0]["title"], "A situação do centro de BH")

    def test_export_writes_the_model_and_reports_card_count(self):
        board = Path(self.tmp.name) / "board.json"
        board.write_text(json.dumps({"version": 1, "cards": [self.card(id=1, state="rendered")]}), encoding="utf-8")
        os.environ["CONTENTFLOW_STORE"] = str(board)

        name, count = exporter.export_content()
        self.assertEqual((name, count), ("content", 1))
        model = self.model("content")
        self.assertIn("standup", model["lanes"])
        self.assertEqual(model["source"], "contentflow board.json (1 cards)")

    def test_a_missing_board_is_an_explicit_error(self):
        os.environ["CONTENTFLOW_STORE"] = str(Path(self.tmp.name) / "nope.json")
        with self.assertRaises(SystemExit):
            exporter.export_content()


class NotesModelTest(ExporterTestCase):
    def test_export_writes_a_render_model_the_viewer_can_draw(self):
        payload = notes.load()
        notes.add_line(payload, "ship the notes window", "Inbox")
        store.save("notes", payload)

        name, count = exporter.export_notes()
        self.assertEqual((name, count), ("notes", 1))

        model = self.model("notes")
        self.assertTrue(model["generated_at"])
        self.assertEqual(model["source"], "will notes store")
        self.assertEqual(model["sections"][0]["lines"][0]["text"], "ship the notes window")
        self.assertIn("at", model["sections"][0]["lines"][0])

    def test_an_empty_store_exports_empty_sections(self):
        _, count = exporter.export_notes()
        self.assertEqual(count, 0)
        self.assertEqual(self.model("notes")["sections"][0]["title"], "Inbox")

    def test_export_rejects_an_unknown_domain(self):
        with self.assertRaises(SystemExit):
            exporter.run(["nope"])

    def test_run_can_be_quiet_for_auto_export(self):
        self.assertEqual(exporter.run(["notes"], quiet=True), 0)


if __name__ == "__main__":
    unittest.main()

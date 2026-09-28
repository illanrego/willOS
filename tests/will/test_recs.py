"""Behaviour tests for the rec list: its own store, its own `will rec` verbs."""

import contextlib
import io
import json
import os
import tempfile
import unittest
from pathlib import Path

from willcli import cli, exporter, notes, recs, store


class RecsTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        os.environ["WILL_STORE"] = str(Path(self.tmp.name) / "store")
        os.environ["WILL_DATA_DIR"] = str(Path(self.tmp.name) / "data")

    def tearDown(self):
        for key in ("WILL_STORE", "WILL_DATA_DIR", "WILL_NO_AUTO_EXPORT"):
            os.environ.pop(key, None)


class RecsStoreTest(RecsTestCase):
    def test_a_rec_keeps_its_id_order_and_timestamp(self):
        payload = recs.load()
        first = recs.add(payload, "deliverance (1972)")
        second = recs.add(payload, "  mr inbetween (tv)  ")

        self.assertEqual((first["id"], second["id"]), (1, 2))
        self.assertEqual(second["text"], "mr inbetween (tv)")
        self.assertTrue(first["at"])
        self.assertEqual([row["text"] for row in recs.rows(payload)], ["deliverance (1972)", "mr inbetween (tv)"])

    def test_an_empty_rec_never_lands_in_the_store(self):
        with self.assertRaises(SystemExit):
            recs.add(recs.load(), "   ")

    def test_removing_by_id_and_an_unknown_id(self):
        payload = recs.load()
        recs.add(payload, "the bear")
        recs.add(payload, "golden girls tv")

        removed = recs.remove(payload, 1)
        self.assertEqual(removed["text"], "the bear")
        self.assertEqual([row["id"] for row in recs.rows(payload)], [2])
        with self.assertRaises(SystemExit):
            recs.remove(payload, 99)

    def test_the_legacy_rows_import_once_and_skip_blanks(self):
        payload = recs.load()
        rows = [
            {"text": "The Bear"},
            {"text": ""},
            {"title": "Shine (1996)"},
            "not a row",
        ]
        self.assertEqual(recs.import_rows(payload, rows), 2)
        # Running it twice must not double the list.
        self.assertEqual(recs.import_rows(payload, rows), 0)
        self.assertEqual([row["text"] for row in recs.rows(payload)], ["The Bear", "Shine (1996)"])

    def test_the_parked_notes_section_moves_out_of_the_notebook(self):
        notes_payload = notes.load()
        for text in ("deliverance (1972)", "cool hand luke"):
            notes.add_line(notes_payload, text, "Rec List")
        notes.add_line(notes_payload, "keep me", "Inbox")

        payload = recs.load()
        self.assertEqual(recs.import_note_lines(payload, notes_payload, "Rec List"), 2)
        self.assertEqual([row["text"] for row in recs.rows(payload)], ["deliverance (1972)", "cool hand luke"])
        self.assertIsNone(notes.find_section(notes_payload, "Rec List"))
        self.assertEqual([line["text"] for _, line in notes.section_lines(notes_payload)], ["keep me"])

        # The lines left the notebook, so a second pass has nothing to move.
        self.assertEqual(recs.import_note_lines(payload, notes_payload, "Rec List"), 0)
        self.assertEqual(len(recs.rows(payload)), 2)

    def test_a_rec_already_on_the_list_is_not_moved_twice(self):
        payload = recs.load()
        recs.add(payload, "the bear")
        notes_payload = notes.load()
        notes.add_line(notes_payload, "The Bear", "Rec List")

        self.assertEqual(recs.import_note_lines(payload, notes_payload, "Rec List"), 1)
        self.assertEqual([row["text"] for row in recs.rows(payload)], ["the bear"])


class RecsCliTest(RecsTestCase):
    def run_will(self, *argv):
        os.environ["WILL_NO_AUTO_EXPORT"] = "1"
        stream = io.StringIO()
        with contextlib.redirect_stdout(stream):
            code = cli.main(list(argv))
        return code, stream.getvalue()

    def test_add_list_and_rm_round_trip_through_the_store(self):
        code, out = self.run_will("rec", "add", "deliverance (1972)")
        self.assertEqual(code, 0)
        self.assertIn("deliverance (1972)", out)

        code, out = self.run_will("rec")
        self.assertIn("1", out)
        self.assertIn("deliverance (1972)", out)

        code, out = self.run_will("rec", "rm", "1")
        self.assertEqual(code, 0)
        code, out = self.run_will("rec", "list")
        self.assertIn("no recs yet", out)

    def test_a_bare_rec_command_adds_instead_of_failing(self):
        self.run_will("rec", "five easy pieces")
        self.assertEqual([row["text"] for row in recs.rows(recs.load())], ["five easy pieces"])

    def test_import_from_notes_moves_the_section_and_saves_both_stores(self):
        notes_payload = notes.load()
        notes.add_line(notes_payload, "all that jazz", "Rec List")
        store.save("notes", notes_payload)

        code, out = self.run_will("rec", "import", "--from-notes")
        self.assertEqual(code, 0)
        self.assertIn("moved 1 lines", out)

        self.assertEqual([row["text"] for row in recs.rows(recs.load())], ["all that jazz"])
        self.assertIsNone(notes.find_section(notes.load(), "Rec List"))

    def test_import_from_a_legacy_json_without_the_auto_export(self):
        path = Path(self.tmp.name) / "legacy.json"
        path.write_text(json.dumps({"recommendations": [{"text": "blue velvet"}]}), encoding="utf-8")

        code, out = self.run_will("rec", "import", str(path))
        self.assertEqual(code, 0)
        self.assertIn("imported 1 recs", out)
        self.assertEqual([row["text"] for row in recs.rows(recs.load())], ["blue velvet"])


class RecsExporterTest(RecsTestCase):
    def test_the_render_model_carries_the_list_the_window_draws(self):
        payload = recs.load()
        recs.add(payload, "deliverance (1972)")
        recs.add(payload, "the panic in needle park")
        store.save("recs", payload)

        name, count = exporter.export_recs()
        self.assertEqual((name, count), ("recs", 2))

        model = json.loads((Path(os.environ["WILL_DATA_DIR"]) / "recs.json").read_text(encoding="utf-8"))
        self.assertTrue(model["generated_at"])
        self.assertEqual(model["source"], "will recs store")
        self.assertEqual(model["count"], 2)
        self.assertEqual(model["items"][0], {"id": 1, "text": "deliverance (1972)", "at": model["items"][0]["at"]})

    def test_an_empty_store_exports_an_empty_list(self):
        _, count = exporter.export_recs()
        self.assertEqual(count, 0)
        model = json.loads((Path(os.environ["WILL_DATA_DIR"]) / "recs.json").read_text(encoding="utf-8"))
        self.assertEqual(model["items"], [])


if __name__ == "__main__":
    unittest.main()

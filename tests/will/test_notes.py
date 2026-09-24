"""Behaviour tests for the will store and the notebook."""

import json
import os
import tempfile
import unittest
from pathlib import Path

from willcli import exporter, notes, store


class WillStoreTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        os.environ["WILL_STORE"] = str(Path(self.tmp.name) / "store")
        os.environ["WILL_DATA_DIR"] = str(Path(self.tmp.name) / "data")

    def tearDown(self):
        os.environ.pop("WILL_STORE", None)
        os.environ.pop("WILL_DATA_DIR", None)


class NotebookTest(WillStoreTestCase):
    def test_ids_are_sequential_and_land_in_inbox(self):
        payload = notes.load()
        first = notes.add_line(payload, "buy cat food")
        second = notes.add_line(payload, "call the dentist")
        self.assertEqual([first["id"], second["id"]], [1, 2])
        self.assertEqual(len(notes.find_section(payload, "Inbox")["lines"]), 2)
        self.assertTrue(first["at"])

    def test_a_named_section_is_created_on_demand(self):
        payload = notes.load()
        notes.add_line(payload, "opener about BH downtown", "Bits")
        section = notes.find_section(payload, "bits")
        self.assertIsNotNone(section)
        self.assertEqual(section["title"], "Bits")
        self.assertEqual(len(notes.find_section(payload, "Inbox")["lines"]), 0)

    def test_blank_notes_are_rejected(self):
        with self.assertRaises(SystemExit):
            notes.add_line(notes.load(), "   ")

    def test_remove_line_takes_it_out_of_its_section(self):
        payload = notes.load()
        entry = notes.add_line(payload, "temporary")
        removed = notes.remove_line(payload, entry["id"])
        self.assertEqual(removed["text"], "temporary")
        self.assertEqual(notes.section_lines(payload), [])
        with self.assertRaises(SystemExit):
            notes.remove_line(payload, 999)

    def test_sections_cannot_be_duplicated(self):
        payload = notes.load()
        notes.add_section(payload, "Vagas")
        with self.assertRaises(SystemExit):
            notes.add_section(payload, "vagas")

    def test_lines_survive_a_store_round_trip(self):
        payload = notes.load()
        notes.add_line(payload, "keep me")
        store.save("notes", payload)
        reloaded = notes.load()
        self.assertEqual(reloaded["next_id"], 2)
        self.assertEqual(notes.section_lines(reloaded)[0][1]["text"], "keep me")

    def test_counting_lines_per_section(self):
        payload = notes.load()
        notes.add_line(payload, "one")
        notes.add_line(payload, "two", "Vagas")
        self.assertEqual(notes.counts(payload), [("Inbox", 1), ("Vagas", 1)])


class ImportTest(WillStoreTestCase):
    def test_bullets_lose_their_marker_and_headings_keep_theirs(self):
        self.assertEqual(notes.normalize_body_line("- historia do stand up"), "historia do stand up")
        self.assertEqual(notes.normalize_body_line("# 27k"), "# 27k")
        self.assertEqual(notes.normalize_body_line(""), "")

    def test_importing_legacy_rows_creates_sections_and_lines(self):
        payload = notes.load()
        added = notes.import_rows(
            payload,
            [
                {"slug": "vagas", "title": "Vagas", "body": "https://frontendbr/vagas\n- remote only\n"},
                {"slug": "jokes", "title": "Jokes Ideas", "body": "# bits\n- uber driver in BH\n"},
                {"title": "", "body": "- dropped"},
            ],
        )
        self.assertEqual(added, 4)
        self.assertEqual(notes.counts(payload), [("Inbox", 0), ("Vagas", 2), ("Jokes Ideas", 2)])

    def test_replace_wipes_the_store_first(self):
        payload = notes.load()
        notes.add_line(payload, "old line")
        notes.import_rows(payload, [{"title": "Inbox", "body": "- new line"}], replace=True)
        texts = [line["text"] for _, line in notes.section_lines(payload)]
        self.assertEqual(texts, ["new line"])


class ExporterTest(WillStoreTestCase):
    def test_export_writes_a_render_model_the_viewer_can_draw(self):
        payload = notes.load()
        notes.add_line(payload, "ship the notes window", "Inbox")
        store.save("notes", payload)

        name, count = exporter.export_notes()
        self.assertEqual((name, count), ("notes", 1))

        target = Path(os.environ["WILL_DATA_DIR"]) / "notes.json"
        self.assertTrue(target.exists())
        model = json.loads(target.read_text(encoding="utf-8"))
        self.assertTrue(model["generated_at"])
        self.assertEqual(model["source"], "will notes store")
        self.assertEqual(model["sections"][0]["title"], "Inbox")
        self.assertEqual(model["sections"][0]["lines"][0]["text"], "ship the notes window")
        self.assertIn("at", model["sections"][0]["lines"][0])

    def test_export_rejects_an_unknown_domain(self):
        with self.assertRaises(SystemExit):
            exporter.run(["nope"])

    def test_an_empty_store_exports_empty_sections(self):
        _, count = exporter.export_notes()
        self.assertEqual(count, 0)


if __name__ == "__main__":
    unittest.main()

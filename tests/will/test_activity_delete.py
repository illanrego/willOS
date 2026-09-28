"""Deleting an activity: `will skill rm` / `will routine rm` ask before they destroy data.

The activity ledger is one record behind both views, so a delete erases the
routine tick, the gamify count and every occurrence at once. That is exactly why
the command must confirm first.
"""

import contextlib
import io
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from willcli import activities, cli, store


class DeleteActivityTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        os.environ["WILL_STORE"] = str(Path(self.tmp.name) / "store")
        os.environ["WILL_DATA_DIR"] = str(Path(self.tmp.name) / "data")
        os.environ["WILL_NO_AUTO_EXPORT"] = "1"
        self.addCleanup(self._clear_env)

    def _clear_env(self):
        for key in ("WILL_STORE", "WILL_DATA_DIR", "WILL_NO_AUTO_EXPORT"):
            os.environ.pop(key, None)

    def seed(self):
        payload = activities.load()
        activities.record(payload, "meditation", amount=1, day="2026-09-21")
        activities.record(payload, "meditation", amount=1, day="2026-09-24")
        store.save("activities", payload)

    def run_cli(self, argv, *, isatty=False, reply=""):
        stream = io.StringIO()
        with mock.patch("sys.stdin.isatty", return_value=isatty), \
                mock.patch("builtins.input", return_value=reply), \
                contextlib.redirect_stdout(stream):
            code = cli.main(argv)
        return code, stream.getvalue()

    def remaining(self):
        return [row["code"] for row in activities.skill_summary(activities.load())]

    def test_skill_rm_with_yes_deletes_the_activity(self):
        self.seed()
        self.assertIn("meditation", self.remaining())

        code, output = self.run_cli(["skill", "rm", "meditation", "--yes"])

        self.assertEqual(code, 0)
        self.assertNotIn("meditation", self.remaining())
        self.assertIn("deleted", output)

    def test_skill_rm_without_a_terminal_refuses_without_yes(self):
        self.seed()
        with self.assertRaises(SystemExit):
            self.run_cli(["skill", "rm", "meditation"])
        self.assertIn("meditation", self.remaining())

    def test_skill_rm_declined_leaves_the_activity_alone(self):
        self.seed()
        code, output = self.run_cli(["skill", "rm", "meditation"], isatty=True, reply="n")
        self.assertEqual(code, 1)
        self.assertIn("aborted", output)
        self.assertIn("meditation", self.remaining())

    def test_skill_rm_confirmed_by_the_prompt_deletes(self):
        self.seed()
        code, _ = self.run_cli(["skill", "rm", "meditation"], isatty=True, reply="y")
        self.assertEqual(code, 0)
        self.assertNotIn("meditation", self.remaining())

    def test_the_delete_is_shared_with_the_gamify_view(self):
        self.seed()
        code, _ = self.run_cli(["skill", "rm", "meditation", "--yes"])
        self.assertEqual(code, 0)
        self.assertNotIn("meditation", self.remaining())

    def test_removing_an_unknown_activity_is_an_explicit_error(self):
        with self.assertRaises(SystemExit):
            self.run_cli(["skill", "rm", "nope", "--yes"])

    def test_the_prompt_names_what_would_be_lost(self):
        self.seed()
        payload = activities.load()
        entry = activities.find(payload, "meditation")
        assert entry is not None
        described = cli._describe_activity(entry)
        self.assertIn("meditation", described)
        self.assertIn("2 occurrences", described)
        self.assertIn("2026-09-24", described)


if __name__ == "__main__":
    unittest.main()

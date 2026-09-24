"""Every command must document how it is actually used, not just its flags.

`will plan --help` should answer "what do I type for the usual things".
"""

import contextlib
import io
import unittest

from willcli import cli


class HelpExamplesTest(unittest.TestCase):
    def help_for(self, *argv):
        stream = io.StringIO()
        with contextlib.redirect_stdout(stream):
            with self.assertRaises(SystemExit):
                cli.main([*argv, "--help"])
        return stream.getvalue()

    def test_every_command_shows_common_uses(self):
        for command in cli.USAGE_EXAMPLES:
            with self.subTest(command=command):
                output = self.help_for() if command == "will" else self.help_for(command)
                self.assertIn("common uses:", output)

    def test_the_examples_are_the_ones_defined(self):
        for command, examples in cli.USAGE_EXAMPLES.items():
            with self.subTest(command=command):
                output = self.help_for() if command == "will" else self.help_for(command)
                self.assertGreaterEqual(len(examples), 1)
                for line in examples:
                    self.assertIn(line, output)

    def test_the_planner_help_shows_a_real_invocation(self):
        output = self.help_for("plan")
        self.assertIn('will plan add "finish willOS" --start 2026-09-24', output)
        self.assertIn("will plan rm 1", output)

    def test_the_top_level_help_lists_every_command(self):
        output = self.help_for()
        for command in cli.COMMANDS:
            self.assertIn(command, output)

    def test_every_subcommand_has_examples(self):
        parser = cli.build_parser()
        subparsers = next(
            action for action in parser._actions if hasattr(action, "choices") and action.choices
        )
        for name in subparsers.choices:
            self.assertIn(name, cli.USAGE_EXAMPLES, f"{name} has no examples block")
        for name in cli.USAGE_EXAMPLES:
            if name == "will":
                continue
            self.assertIn(name, subparsers.choices, f"{name} examples exist but no command does")


if __name__ == "__main__":
    unittest.main()

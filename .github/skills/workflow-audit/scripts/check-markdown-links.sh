#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: check-markdown-links.sh [options] [paths...]

Validate internal Markdown link targets, trailing whitespace, and final newlines
across Git-tracked Markdown (*.md) and Gherkin (*.feature) files.

Options:
  --help          Show this help message and exit
  --check-links   Only check Markdown links
  --check-format  Only check whitespace and trailing newlines

Paths:
  Optional relative paths or patterns to check. If omitted, checks all
  Git-tracked *.md and *.feature files (ignoring files in .gitignore).
EOF
}

check_links=true
check_format=true
custom_paths=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help)
      usage
      exit 0
      ;;
    --check-links)
      check_links=true
      check_format=false
      shift
      ;;
    --check-format)
      check_links=false
      check_format=true
      shift
      ;;
    *)
      custom_paths+=("$1")
      shift
      ;;
  esac
done

# Collect files to inspect
files=()
if [[ ${#custom_paths[@]} -gt 0 ]]; then
  for p in "${custom_paths[@]}"; do
    if [[ -f "$p" ]]; then
      files+=("$p")
    elif [[ -d "$p" ]]; then
      while IFS= read -r f; do
        [[ -n "$f" ]] && files+=("$f")
      done < <(git ls-files "$p/**/*.md" "$p/**/*.feature" "$p/*.md" "$p/*.feature" 2>/dev/null || true)
    fi
  done
else
  while IFS= read -r f; do
    [[ -n "$f" ]] && files+=("$f")
  done < <(git ls-files '*.md' '*.feature')
fi

# De-duplicate files
readarray -t target_files < <(printf '%s\n' "${files[@]}" | awk 'NF && !seen[$0]++')

if [[ ${#target_files[@]} -eq 0 ]]; then
  exit 0
fi

# Run fast perl validator over all collected files
perl -e '
use strict;
use warnings;
use File::Basename;

my $check_links = $ARGV[0] eq "1";
my $check_format = $ARGV[1] eq "1";
my @files = @ARGV[2..$#ARGV];

my $exit_code = 0;

for my $file (@files) {
    next unless -f $file;
    my $dir = dirname($file);

    open my $fh, "<:raw", $file or do {
        warn "$file: could not open: $!\n";
        $exit_code = 1;
        next;
    };
    my $content = do { local $/; <$fh> };
    close $fh;

    if ($check_format) {
        if (length($content) > 0 && substr($content, -1) ne "\n") {
            print STDERR "$file: missing newline at end of file\n";
            $exit_code = 1;
        }
    }

    my @lines = split /\n/, $content, -1;
    pop @lines if @lines && $lines[-1] eq "";

    my $in_code_block = 0;
    my $line_num = 0;

    for my $line (@lines) {
        $line_num++;
        $line =~ s/\r$//;

        if ($check_format) {
            if ($line =~ /[ \t]+$/) {
                print STDERR "$file:$line_num: trailing whitespace\n";
                $exit_code = 1;
            }
        }

        next unless $check_links;
        next unless $file =~ /\.md$/;

        if ($line =~ /^\s*```/) {
            $in_code_block = !$in_code_block;
            next;
        }
        next if $in_code_block;

        # Strip inline code spans
        my $clean = $line;
        $clean =~ s/`[^`]*`//g;

        # Extract markdown links [text](target)
        while ($clean =~ /\[[^]]*\]\(([^)]+)\)/g) {
            my $target = $1;
            $target =~ s/^\s+|\s+$//g;
            next if $target =~ /^(?:https?:\/\/|mailto:|#)/;

            my ($target_path) = split /[#?]/, $target, 2;
            next unless defined $target_path && length($target_path);

            $target_path =~ s/%20/ /g;

            my $resolved;
            if ($target_path =~ m{^/}) {
                $resolved = substr($target_path, 1);
            } else {
                $resolved = "$dir/$target_path";
            }

            unless (-e $resolved) {
                print STDERR "$file:$line_num: broken link target -> $target (resolved: $resolved)\n";
                $exit_code = 1;
            }
        }
    }
}
exit $exit_code;
' "$([[ "$check_links" == true ]] && echo 1 || echo 0)" "$([[ "$check_format" == true ]] && echo 1 || echo 0)" "${target_files[@]}"
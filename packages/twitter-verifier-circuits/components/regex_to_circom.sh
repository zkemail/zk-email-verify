#!/bin/bash
set -o xtrace
zk-regex decomposed -d twitter_reset.json -c twitter_reset_regex.circom -t TwitterResetRegex

# Curl Sheet Helper
Provides a simple interface that allows CSVs to be uploaded which are then parsed and shared back into a team setup format

## Description

The goal is to provide a simple CSV upload that will contain the rules/setup for the games. The sheet will be parsed, teams created and sheets aligned to best spread the created teams using
the sheets. The teams will be kept the same for the configured number of games before changing again and in cases where the teams are changing the players will attempt to be different so
the same players are not together again.

The interface will just be the upload, service processes the csv file and then returns a csv back with the results. Nothing stored.

## CSV Format
- number sheets,##,The number of sheets that are available for usage
- number games,##,The total number of games expected
- teams change,##,The teams will change every these number of games
- id,experience,wanted position,won't position,must be with,shouldn't be with,can't be with
  - the id being used for the player - could be name, number, key, just needs to be unique
  - their experience with 0 being new/none
  - the space seperated wanted/preferred positions
  - the space separated won't do positions
  - the space separated list of ids that must be with
  - the space separated list of ids that shouldn't be with but not blocked
  - the space separated list of ids that cannot be with
- positions are; lead, second, vice, skip


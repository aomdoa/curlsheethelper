/**
 * @copyright 2026 David Shurgold <aomdoa@gmail.com>
 */
import Papa from 'papaparse'
import { arrayShuffle } from 'array-shuffle'

export type RawCurlConfig = {
  sheets: string
  games: string 
  team_change: string
  players: string
}
export default function processCsv(raw: RawCurlConfig): any {
  const sheets = raw.sheets ? parseInt(raw.sheets) : 6
  const games = raw.games ? parseInt(raw.games) : 10
  const teamChanges = raw.team_change ? parseInt(raw.team_change) : 0
  const players = Papa.parse(raw.players, {
    header: true,
    skipEmptyLines: true,
  }).data
  arrayShuffle(players) // mix this up for every process

  // Today we'll just fail if we have too many or too few players
  if (players.length < 6) {
    throw new Error('Not enough players. We need 6 or more to make a game')
  } else if([9, 10, 11, 17].includes(players.length)) {
    throw new Error('Afraid the magic number has been hit! We can\'t handle 9, 10, 11, or 17 players as the sheets will not work.')
  } else if(players.length > sheets * 8) {
    throw new Error(`Too many players. We can only handle ${sheets * 8} players with ${sheets} sheets`)
  }

  const teamSetup: string[][] = []
  while(players.length > 0) {
    const sheetPlayers = players.splice(0, 8) as string[]
    if (sheetPlayers.length === 8 || sheetPlayers.length === 7) {
      teamSetup.push(sheetPlayers.splice(0, 4), sheetPlayers)
    } else if (sheetPlayers.length === 6) {
      teamSetup.push(sheetPlayers.splice(0, 3), sheetPlayers)
    } else {
      // now the stealing begins. We have 5 or less players left, so we'll steal from the existing teams to make it work
      while(sheetPlayers.length < 6) {
        const stealFrom = teamSetup.findIndex(team => team.length > 3)
        if (stealFrom === undefined) {
          throw new Error('Unexpected error: no teams to steal from')
        }
        const playerToSteal = teamSetup[stealFrom].pop()
        if (playerToSteal) {
          sheetPlayers.push(playerToSteal)
        }
      }
      teamSetup.push(sheetPlayers.splice(0, 3), sheetPlayers)
    }
  }

  console.log(`${teamSetup.length} teams setup`)
  teamSetup.forEach((team, index) => {
    console.log(`Team ${index + 1}: ${team.length}`)
  })
  return { sheets, games, teamChanges, teamSetup }
}
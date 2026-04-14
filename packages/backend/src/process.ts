/**
 * @copyright 2026 David Shurgold <aomdoa@gmail.com>
 */
import Papa from 'papaparse'
import { arrayShuffle } from 'array-shuffle'

const WANTED_POSITION_WEIGHT = 5
const DISLIKE_POSITION_WEIGHT = -5
const MUST_BE_WITH_WEIGHT = 100
const SHOULDNT_BE_WITH_WEIGHT = -10
const MUST_NOT_BE_WITH_WEIGHT = -50

enum CSV_COLUMNS {
  ID = 0,
  EXPERIENCE = 1,
  WANTED_POSITION = 2,
  DISLIKE_POSITION = 3,
  MUST_BE_WITH = 4,
  SHOULDNT_BE_WITH = 5,
  MUST_NOT_BE_WITH = 6,
}

enum POSITION {
  LEAD = 'lead',
  SECOND = 'second',
  VICE = 'vice',
  SKIP = 'skip',
}

export type RawCurlConfig = {
  sheets: string
  games: string
  team_change: string
  players: string
}

export type CurlPlayer = {
  id: string
  experience: number
  wantedPosition: POSITION[]
  dislikePosition: POSITION[]
  mustBeWith: string[]
  shouldntBeWith: string[]
  mustNotBeWith: string[]
}

export type CurlTeam = {
  name: string
  open: number
  members: Map<POSITION, CurlPlayer>
}

// return the number of full and partial sheets
export function solveSheets(n: number): { fours: number; threes: number } {
  for (let c = Math.floor(n / 8); c >= 0; c--) {
    for (let b = Math.floor((n - 8 * c) / 7); b >= 0; b--) {
      const rem = n - 8 * c - 7 * b
      if (rem >= 0 && rem % 6 === 0) {
        const fours = c * 2 + b
        const threes = b + rem / 3
        return { fours, threes }
      }
    }
  }
  throw new Error(`Unable to solve for ${n} players`)
}

export function parseString(value: string | undefined): string[] {
  if (!value) return []
  const trimmed = value.trim()
  if (trimmed.length === 0) return []
  return trimmed.split(' ').map((s) => s.trim())
}

export function getPositionScore(player: CurlPlayer, team: CurlTeam): number {
  let score = 0
  if (player.wantedPosition.length > 0) {
    for (const pos of player.wantedPosition) {
      if (!team.members.has(pos)) {
        score += WANTED_POSITION_WEIGHT
      }
    }
  }
  // only inspect dislikes if there's no wanted
  if (player.dislikePosition.length > 0 && score === 0) {
    for (const pos of player.dislikePosition) {
      if (team.members.has(pos as POSITION)) {
        score += DISLIKE_POSITION_WEIGHT
      }
    }
  }
  return score
}

export function getTeammateScore(player: CurlPlayer, team: CurlTeam): number {
  let score = 0
  const teammates = Array.from(team.members.values()).map((p) => p.id)
  for (const mustBeWith of player.mustBeWith) {
    if (teammates.includes(mustBeWith)) {
      score += MUST_BE_WITH_WEIGHT
    }
  }
  for (const shouldntBeWith of player.shouldntBeWith) {
    if (teammates.includes(shouldntBeWith)) {
      score += SHOULDNT_BE_WITH_WEIGHT
    }
  }
  for (const mustNotBeWith of player.mustNotBeWith) {
    if (teammates.includes(mustNotBeWith)) {
      score += MUST_NOT_BE_WITH_WEIGHT
    }
  }
  return score
}

export default function processCsv(raw: RawCurlConfig): string {
  const sheets = raw.sheets ? parseInt(raw.sheets) : 6
  const players = (
    Papa.parse(raw.players, {
      header: false,
      skipEmptyLines: true,
    }).data as string[][]
  )
    .filter((row) => {
      const id = row[CSV_COLUMNS.ID]?.trim()
      return id != 'id' && id != undefined && id.length > 0
    }).map((row) => {
      return {
        id: row[CSV_COLUMNS.ID],
        experience: parseInt(row[CSV_COLUMNS.EXPERIENCE]) ?? 0,
        wantedPosition: parseString(row[CSV_COLUMNS.WANTED_POSITION]),
        dislikePosition: parseString(row[CSV_COLUMNS.DISLIKE_POSITION]),
        mustBeWith: parseString(row[CSV_COLUMNS.MUST_BE_WITH]),
        shouldntBeWith: parseString(row[CSV_COLUMNS.SHOULDNT_BE_WITH]),
        mustNotBeWith: parseString(row[CSV_COLUMNS.MUST_NOT_BE_WITH]),
      } as CurlPlayer
    })
  console.dir(players)
  console.log(`Parsed ${players.length} players from CSV`)

  // Today we'll just fail if we have too many or too few players
  if (players.length < 6) {
    throw new Error('Not enough players. We need 6 or more to make a game')
  } else if ([9, 10, 11, 17].includes(players.length)) {
    throw new Error(
      "Afraid the magic number has been hit! We can't handle 9, 10, 11, or 17 players as the sheets will not work."
    )
  } else if (players.length > sheets * 8) {
    throw new Error(`Too many players. We can only handle ${sheets * 8} players with ${sheets} sheets`)
  }
  arrayShuffle(players) // mix this up for every process

  // Structure out the teams
  let teamNumber = 1
  const teamSetup: CurlTeam[] = []
  const { fours, threes } = solveSheets(players.length)
  for (let i = 0; i < fours; i++) {
    teamSetup.push({ name: `Team ${teamNumber}`, open: 4, members: new Map<POSITION, CurlPlayer>() })
    teamNumber++
  }
  for (let i = 0; i < threes; i++) {
    teamSetup.push({ name: `Team ${teamNumber}`, open: 3, members: new Map<POSITION, CurlPlayer>() })
    teamNumber++
  }

  for (const player of players) {
    let bestTeamIndex = -1
    let bestScore = -Infinity
    let bestPosition: POSITION | null = null

    for (let i = 0; i < teamSetup.length; i++) {
      const team = teamSetup[i]
      if (team.open <= 0) continue
      let posScore = getPositionScore(player, team)
      let score = posScore + getTeammateScore(player, team)
      if (score > bestScore || (score === bestScore && posScore > 0)) {
        bestScore = score
        bestTeamIndex = i
        if (posScore > 0) {
          // if we have a position preference, try to honour it
          const availablePositions = Object.values(POSITION).filter((pos) => !team.members.has(pos as POSITION))
          const wantedPositions = player.wantedPosition.filter((pos) => availablePositions.includes(pos as POSITION))
          if (wantedPositions.length > 0) {
            bestPosition = wantedPositions[0] as POSITION
          } else {
            bestPosition = availablePositions[0] as POSITION
          }
        }
      }
    }

    if (bestTeamIndex === -1) {
      throw new Error(`Unable to assign player ${player.id} to a team`)
    }

    const team = teamSetup[bestTeamIndex]
    const positionToAssign =
      bestPosition ?? (Object.values(POSITION).find((pos) => !team.members.has(pos as POSITION)) as POSITION)
    team.members.set(positionToAssign, { ...player })
    team.open--
  }

  const order = ['skip', 'vice', 'second', 'lead']
  let output = 'id,exp,want_pos,not_pos,with,notwith,mustnotwith,team,position\n'
  teamSetup.forEach((team) => {
    const names = [...team.members.values()].map((p) => p.id)
    ;[...team.members.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])).forEach(([position, player]) => {
      const otherNames = names.filter((n) => n !== player.id)
      player.shouldntBeWith.push(...otherNames)
      output += `${player.id},${player.experience},${player.wantedPosition.join(' ')},${player.dislikePosition.join(' ')},${player.mustBeWith.join(' ')},${player.shouldntBeWith.join(' ')},${player.mustNotBeWith.join(' ')},${team.name},${position}\n`
    })
  })
  return output
}

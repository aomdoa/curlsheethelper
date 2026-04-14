<script setup lang="ts">

const prettify = () => {
  const textarea = document.querySelector('.csv') as HTMLTextAreaElement
  const lines = textarea.value.trim().split('\n')
  const rows = lines.map(r => r.split(','))
  const maxCols: number[] = []
  rows.forEach(row => {
    row.forEach((cell, i) => {
      const len = cell.trim().length
      if (!maxCols[i] || len > maxCols[i]) {
        maxCols[i] = len
      }
    })
  })

  const newLines = rows.map(row => row.map((cell, i) => cell.trim().concat(',').padEnd((maxCols[i] ?? 0)+1)).join(' ').trim().slice(0, -1)).join('\n')
  textarea.value = newLines
}

const process = async () => {

  const textarea = document.querySelector('.csv') as HTMLTextAreaElement
  const url = import.meta.env.VITE_API_URL + '/teams'

  try {
    const rawResult = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheets: 6, players: textarea.value })
    })
    const data = await rawResult.json() as { message: string, result?: string }
    if (rawResult.status !== 200 || data.message != 'success' || !data.result) {
      displayError(`${data.message}`)
      console.error('Error response:', data)
      return
    }
    textarea.value = data.result
  } catch (err) {
    const error = err as Error
    displayError(`An error occurred while processing the teams: ${error.message}`)
    console.error('Error processing teams:', err)
  }
}

const displayError = (message: string) => {
  const errorElement = document.querySelector('.error') as HTMLParagraphElement
  errorElement.textContent = message
  errorElement.style.display = 'block'
}
</script>

<template>
  <header>
    <div class="header">
      <img alt="Logo" class="logo" src="/curllogo.png" />
      <h1 class="title">Curl Sheet Helper</h1>
    </div>
    </header>
    <main>
    <div class="wrapper">
      <p>This is just a simple helper that will produce teams based on the inputted CSV data. The example is below and to use simply update and send to get the results.</p>
      <p class="error"></p>
      <textarea class="csv">
id,exp,want_pos,not_pos,with,notwith,mustnotwith,team
a01,1,,vice skip,d01
a02,1,,vice skip
a03,1,,vice skip
a04,1,,vice skip
b01,3,skip,,,b02
b02,3,lead,vice skip,,b01,
b03,3,lead,skip,,,
b04,3,lead second,skip,,,
c01,4,second vice,,,,
c02,4,vice skip,lead,,,
c03,4,vice skip,,,,
c04,4,vice skip,lead second,,,
d01,8,skip,lead,a01,,d02
d02,8,skip,lead second vice,,,d01
d03,8,skip vice,,,,
d04,8,,,,,
      </textarea>
    </div>
    <div class="commands">
      <button v-on:click="prettify">Prettify</button>
      <button v-on:click="process">Process</button>
    </div>
    </main>
</template>

<style scoped>

</style>

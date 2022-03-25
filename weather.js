// # Roam Research `{{Daily Weather}}`
//
// ## Installation
//
// - Create a new block in your graph with the text `{{[[roam/js]]}}`.
// - Click "Yes, I know what I'm doing".
// - Create a new block as a child.
// - Type a backslash (`/`), then find and select the "Javascript Code Block" option.
// - Paste the contents of this file into the child block.
// - Get an API token from openweathermap.org:: https://www.discogs.com/settings/developers
// - Replace your token in the code (line 23).
// - Replace your latitude and longitude in the code (lines 24-25).
//
// ## Usage
//
// - You can now create blocks with the text `{{Daily Weather}}`
// - A button will appear. Click it and today's weather details will be written to your Roam graph.
//
// ## TODO

const token = ''
const LAT = ''
const LON = ''

if (window.weatherBtn) {
  document.removeEventListener('click', weatherBtn.handleClick)
} else {
  window.weatherBtn = {}
}

weatherBtn.handleClick = async (e) => {
  if (e.target.tagName === 'BUTTON') {
    const block = e.target.closest('.roam-block')

    if (!block) return

    const uid = block.id.substring(block.id.length - 9)
    const content = await window.roamAlphaAPI
      .q(`[:find (pull ?block [:block/string]) 
          :where [?block :block/uid "${uid}"]]`)[0][0].string

    if (!content) return

    const btnRegExp = /^(\{\{Daily Weather\}\})(.*)/
    const result = btnRegExp.exec(content)

    if (!result) return

    const [_, btnText] = result

    if (btnText === `{{Daily Weather}}`) {
      addData(uid)
    }
  }
}

document.addEventListener('click', weatherBtn.handleClick, false)

const getWeather = async () => {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${LAT}&lon=${LON}&units=imperial&appid=${token}`
    )

    if (!res.ok) {
      const text = await res.text()

      return Promise.reject(text)
    } else {
      return await res.json()
    }
  } catch (err) {
    console.error(`Daily Weather :: Error`, err)
  }
}

const addWeather = (currentDay, page_uid) => {
  const {
    temp: { min, max },
    humidity,
    wind_speed,
    sunrise,
    sunset,
    weather = [],
  } = currentDay

  window.roamAlphaAPI.updateBlock({
    block: {
      uid: page_uid,
      string: `[[Daily Weather]]`,
    },
  })

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 0 },
    block: {
      string: `forecast:: ${weather
        .map(({ description }) => description)
        .join(', ')}`,
    },
  })

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 1 },
    block: {
      string: `temperature:: ${Math.floor(min)}℉ / ${Math.floor(max)}℉`,
    },
  })

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 2 },
    block: { string: `humidity:: ${humidity}%` },
  })

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 3 },
    block: { string: `wind:: ${Math.floor(wind_speed)} mph` },
  })

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 4 },
    block: {
      string: `sun:: ${toLocaleTimeString(sunrise)} / ${toLocaleTimeString(
        sunset
      )}`,
    },
  })
}

const toLocaleTimeString = (dt) =>
  new Date(dt * 1000).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

const addData = async (uid) => {
  const result = await getWeather()

  if (result.daily) {
    addWeather(result.daily[0], uid)
  } else {
    window.alert('No results!')
    console.log(`Daily Weather :: No Results`)
  }
}

// # Roam Research `{{Daily Weather}}`
//
// ## Installation
//
// - Create a new block in your graph with the text `{{[[roam/js]]}}`.
// - Click "Yes, I know what I'm doing".
// - Create a new block as a child.
// - Type a backslash (`/`), then find and select the "Javascript Code Block" option.
// - Paste the contents of this file into the child block.
// - Get an openweathermap.org API token: https://www.discogs.com/settings/developers
// - Get an Google Maps API token and enable geocoding: https://developers.google.com/maps/documentation/geocoding/
// - Replace your tokens in the code (lines 24 + 25).
// - Replace your default latitude and longitude in the code (lines 26-27). Set these to your typical location. When you are traveling, you can paste in a lat, lng after the button code to fetch the forecast at that location.
//
// ## Usage
//
// - You can now create blocks with the text `{{Daily Weather}} <lat, lng>`
// - A button will appear. Click it and today's weather details along with your current city and state (US only?) will be written to your Roam graph.
//
// ## Notes
//
// - I attempted to use the Geolocation API but it does not seem to work within Roam.

const WEATHER_API_TOKEN = ''
const GOOGLE_MAPS_API_KEY = ''
const DEFAULT_LATITUDE = ''
const DEFAULT_LONGITUDE = ''

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

    const [_, btnText, query] = result

    if (btnText === `{{Daily Weather}}`) {
      addData(query, uid)
    }
  }
}

document.addEventListener('click', weatherBtn.handleClick, false)

const getWeather = async ({ latitude, longitude }) => {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&units=imperial&appid=${WEATHER_API_TOKEN}`
    )

    if (!res.ok) {
      const text = await res.text()

      return Promise.reject(text)
    } else {
      return await res.json()
    }
  } catch (err) {
    console.error(`Daily Weather :: Error fetching weather`, err)
  }
}

const getAddress = async ({ latitude, longitude }) => {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    )

    if (!res.ok) {
      const text = await res.text()

      return Promise.reject(text)
    } else {
      return await res.json()
    }
  } catch (err) {
    console.error(`Daily Weather :: Error fetching address`, err)
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

const addAddress = ({ address_components }, page_uid) => {
  const getCity = (list) => {
    const city = list.find(
      (x) =>
        x.types.indexOf('locality') !== -1 ||
        x.types.indexOf('sublocality') !== -1
    )

    return city.long_name
  }

  const getState = (list) => {
    const state = list.find(
      (x) => x.types.indexOf('administrative_area_level_1') !== -1
    )

    return state.long_name
  }

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 5 },
    block: {
      string: `location:: ${getCity(address_components)}, [[${getState(
        address_components
      )}]]`,
    },
  })
}

const toLocaleTimeString = (dt) =>
  new Date(dt * 1000).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

const parseQuery = (query) => {
  if (!query) {
    return {
      latitude: DEFAULT_LATITUDE,
      longitude: DEFAULT_LONGITUDE,
    }
  }
  const [latitude, longitude] = query.split(',')

  return { latitude: latitude.trim(), longitude: longitude.trim() }
}

const addData = async (query, uid) => {
  const coords = parseQuery(query)

  const weather = await getWeather(coords)

  if (weather.daily) {
    addWeather(weather.daily[0], uid)
  } else {
    window.alert('No weather results!')
    console.log(`Daily Weather :: No Weather Results`)
  }

  const address = await getAddress(coords)

  if (address.results) {
    addAddress(address.results[0], uid)
  } else {
    console.log(`Daily Weather :: No Address Results`)
  }
}

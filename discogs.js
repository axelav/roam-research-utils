// # Roam Research `{{Discogs Search}}`
//
// ## Installation
//
// - Create a new block in your graph with the text `{{[[roam/js]]}}`.
// - Click "Yes, I know what I'm doing".
// - Create a new block as a child.
// - Type a backslash (`/`), then find and select the "Javascript Code Block" option.
// - Paste the contents of this file into the child block.
// - Get an API token from Discogs: https://www.discogs.com/settings/developers
// - Replace your token in the code (line 22).
//
// ## Usage
//
// - You can now create blocks with the text `{{Discogs Search}} <search terms here>`
// - A button will appear. Click it and the release details will be written to your Roam graph.
//
// ## TODO
//
// - better message to user when no results; only logs to console currently

const token = ''

if (window.discogsBtn) {
  document.removeEventListener(discogsBtn.handleClick)
} else {
  window.discogsBtn = {}
}

discogsBtn.handleClick = async (e) => {
  if (e.target.tagName === 'BUTTON') {
    const block = e.target.closest('.roam-block')

    if (!block) return

    const uid = block.id.substring(block.id.length - 9)
    const content = await window.roamAlphaAPI
      .q(`[:find (pull ?block [:block/string]) 
          :where [?block :block/uid "${uid}"]]`)[0][0].string

    if (!content) return

    const btnRegExp = /^(\{\{Discogs Search\}\})(.*)/
    const result = btnRegExp.exec(content)

    if (!result) return

    const [_, btnText, query] = result

    if (btnText === '{{Discogs Search}}') {
      const mainText = await addData(query, uid)

      window.roamAlphaAPI.updateBlock({
        block: {
          uid: uid,
          string: mainText,
        },
      })
    }
  }
}

document.addEventListener('click', discogsBtn.handleClick, false)

const handleResponse = async (res) => {
  if (!res.ok) {
    const text = await res.text()

    return Promise.reject(text)
  } else {
    return await res.json()
  }
}

const getSearchResults = async (query, isMaster = true) => {
  const res = await fetch(
    `https://api.discogs.com/database/search?token=${token}&q=${query}${
      isMaster ? '&type=master' : ''
    }`
  )

  return handleResponse(res)
}

const getMasterRelease = async (id) => {
  const res = await fetch(
    `https://api.discogs.com/masters/${id}?token=${token}`
  )

  return handleResponse(res)
}

const getMainRelease = async (id) => {
  const res = await fetch(
    `https://api.discogs.com/releases/${id}?token=${token}`
  )

  return handleResponse(res)
}

const unique = (x, idx, self) => self.indexOf(x) === idx
const writeTag = (str) => {
  if (/ /.test(str)) {
    return `#[[${str.toLowerCase()}]]`
  } else {
    return `#${str.toLowerCase()}`
  }
}

const addRelease = (release, page_uid) => {
  const {
    artists = [],
    title,
    year,
    genres = [],
    styles = [],
    labels = [],
  } = release
  const tags = [...genres, ...styles]

  const artistsJoined = artists.map(({ name }) => name).join(artists.join)
  const mainText = `${artistsJoined}, __${title}__ ([[${year}]])`
  const label = labels[0]?.name || '[[Not On Label]]'

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 0 },
    block: { string: `rating:: ` },
  })

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 1 },
    block: { string: `record label:: [[${label}]]` },
  })

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 2 },
    block: {
      string: `tags:: #album ${tags.filter(unique).map(writeTag).join(' ')}`,
    },
  })

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 3 },
    block: { string: `url:: ${release.uri}` },
  })

  return mainText
}

const addData = async (query, uid) => {
  try {
    const searchResults = await getSearchResults(query)

    if (searchResults.results.length > 0) {
      const firstResult = searchResults.results[0]
      const masterRelease = await getMasterRelease(firstResult.master_id)
      const { labels } = await getMainRelease(masterRelease.main_release)

      return addRelease({ ...masterRelease, labels }, uid)
    }

    const allSearchResults = await getSearchResults(query, false)

    if (allSearchResults.results.length > 0) {
      const release = await getMainRelease(allSearchResults.results[0].id)

      return addRelease(release, uid)
    } else {
      window.alert('No results!')
      console.log('Discogs Search :: No Results')
    }
  } catch (err) {
    console.error('Discogs Search :: Error', err)
  }
}

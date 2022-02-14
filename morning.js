if (window.morningBtn) {
  document.removeEventListener(morningBtn.handleClick)
} else {
  window.morningBtn = {}
}

morningBtn.handleClick = async (e) => {
  if (e.target.tagName === 'BUTTON') {
    const block = e.target.closest('.roam-block')

    if (!block) return

    const uid = block.id.substring(block.id.length - 9)
    const content = await window.roamAlphaAPI
      .q(`[:find (pull ?block [:block/string]) 
          :where [?block :block/uid "${uid}"]]`)[0][0].string

    if (!content) return

    const btnRegExp = /^(\{\{Morning Walk\}\})(.*)/
    const result = btnRegExp.exec(content)

    if (!result) return

    const [_, btnText] = result

    if (btnText === `{{Morning Walk}}`) {
      writeFields(uid)
    }
  }
}

document.addEventListener('click', morningBtn.handleClick, false)

const writeFields = (page_uid) => {
  const getTime = () => {
    const date = new Date()
    const h = date.getHours()
    const m = date.getMinutes()

    let hours = h
    let minutes = m

    if (m > 0 && m < 10) {
      minutes = '0' + m
    } else if (m === 0) {
      minutes = '00'
    }

    if (h < 10) {
      hours = '0' + h
    }

    return `${hours}:${minutes}`
  }

  window.roamAlphaAPI.updateBlock({
    block: {
      uid: page_uid,
      string: `${getTime()} [[Morning Walk]]`,
    },
  })

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 0 },
    block: {
      string: '',
    },
  })

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 1 },
    block: {
      string: `{{[[POMO]]: 10}}`,
    },
  })
}

if (window.statsBtn) {
  document.removeEventListener('click', statsBtn.handleClick)
} else {
  window.statsBtn = {}
}

statsBtn.handleClick = async (e) => {
  if (e.target.tagName === 'BUTTON') {
    const block = e.target.closest('.roam-block')

    if (!block) return

    const uid = block.id.substring(block.id.length - 9)
    const content = await window.roamAlphaAPI
      .q(`[:find (pull ?block [:block/string]) 
          :where [?block :block/uid "${uid}"]]`)[0][0].string

    if (!content) return

    const btnRegExp = /^(\{\{Daily Stats\}\})(.*)/
    const result = btnRegExp.exec(content)

    if (!result) return

    const [_, btnText] = result

    if (btnText === `{{Daily Stats}}`) {
      writeFields(uid)
    }
  }
}

document.addEventListener('click', statsBtn.handleClick, false)

const writeFields = (page_uid) => {
  window.roamAlphaAPI.updateBlock({
    block: {
      uid: page_uid,
      string: `[[Daily Stats]]`,
    },
  })

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 0 },
    block: {
      string: 'HR:: ',
    },
  })

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 1 },
    block: {
      string: 'calories:: ',
    },
  })

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 2 },
    block: {
      string: 'hydration:: ',
    },
  })

  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 3 },
    block: {
      string: 'sleep:: ',
    },
  })
  window.roamAlphaAPI.createBlock({
    location: { 'parent-uid': page_uid, order: 4 },
    block: {
      string: 'weight:: ',
    },
  })
}

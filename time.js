// # Roam Research `{{Current Time}}`
//
// ## Installation
//
// - Create a new block in your graph with the text `{{[[roam/js]]}}`.
// - Click "Yes, I know what I'm doing".
// - Create a new block as a child.
// - Type a backslash (`/`), then find and select the "Javascript Code Block" option.
// - Paste the contents of this file into the child block.
//
// ## Usage
//
// - You can now create blocks with the text `{{Current Time}}`
// - A button will appear. Click it and the current time will be written to the block.

if (window.currentTimeBtn) {
  document.removeEventListener('click', currentTimeBtn.handleClick)
} else {
  window.currentTimeBtn = {}
}

currentTimeBtn.handleClick = async (e) => {
  if (e.target.tagName === 'BUTTON') {
    const block = e.target.closest('.roam-block')

    if (!block) return

    const uid = block.id.substring(block.id.length - 9)
    const content = await window.roamAlphaAPI
      .q(`[:find (pull ?block [:block/string]) 
          :where [?block :block/uid "${uid}"]]`)[0][0].string

    if (!content) return

    const btnRegExp = /^(\{\{Current Time}\})(.*)/
    const result = btnRegExp.exec(content)

    if (!result) return

    const [_, btnText, blockText] = result

    if (btnText === '{{Current Time}}') {
      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      })
      const mainText = `${currentTime}${blockText}`

      window.roamAlphaAPI.updateBlock({
        block: {
          uid: uid,
          string: mainText,
        },
      })
    }
  }
}

document.addEventListener('click', currentTimeBtn.handleClick, false)

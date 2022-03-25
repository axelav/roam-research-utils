// # Roam Research `{{Daily Agenda}}`
//
// Use a `{{Daily Agenda}}` button to find all TODOs in your graph associated
// with the current date.
//
// ## TODO
//
// - add overdue TODOs?

if (window.agendaBtn) {
  document.removeEventListener('click', agendaBtn.handleClick)
} else {
  window.agendaBtn = {}
}

agendaBtn.handleClick = async (e) => {
  if (e.target.tagName === 'BUTTON') {
    const block = e.target.closest('.roam-block')

    if (!block) return

    const currentBlockUid = block.id.substring(block.id.length - 9)
    const content = await window.roamAlphaAPI
      .q(`[:find (pull ?block [:block/string])
          :where [?block :block/uid "${currentBlockUid}"]]`)[0][0].string

    // TODO handle this in query above
    const parents = await window.roamAlphaAPI
      .q(`[:find (pull ?b [:block/parents])
          :where [?b :block/uid "${currentBlockUid}"]]`)[0][0].parents

    const parentUid = await window.roamAlphaAPI.pull(
      '[:block/uid]',
      parents[parents.length - 1].id
    )[':block/uid']

    if (!content) return

    const btnRegExp = /^(\{\{Daily Agenda\}\})(.*)/
    const result = btnRegExp.exec(content)

    if (!result) return

    const [_, btnText] = result

    if (btnText === `{{Daily Agenda}}`) {
      addData(currentBlockUid, parentUid)
    }
  }
}

document.addEventListener('click', agendaBtn.handleClick, false)

const getTodayTodos = () => {
  const today = getRoamDate(new Date())

  // stole this query from roam/js
  // https://github.com/dvargas92495/roamjs-smartblocks/blob/9ca306e9299f7c015733aa86d258f144ea82f867/src/smartblocks.ts#L716
  const todos = window.roamAlphaAPI
    .q(
      `[:find ?u ?s :where
            [?r :block/uid ?u] [?r :block/string ?s]
              (or-join [?r ?d]
                (and [?r :block/refs ?d])
                (and [?r :block/page ?d])
                (and [?r :block/parents ?c] [?c :block/refs ?d])
                (and [?c :block/refs ?d] [?c :block/parents ?r])
              )
            [?r :block/refs ?p] [?p :node/title "TODO"] [?d :node/title "${today}"]
        ]`
    )
    .map(([uid, text]) => ({ uid, text }))

  return todos
}

const addData = async (currentBlockUid, parentUid) => {
  const todos = getTodayTodos()

  if (todos.length > 0) {
    writeTodos(todos, currentBlockUid, parentUid)
  } else {
    console.log(`Daily Agenda :: No Results`)
  }
}

const writeTodos = (todos, uid, page_uid) => {
  window.roamAlphaAPI.deleteBlock({ block: { uid } })

  todos.map((x, i) => {
    window.roamAlphaAPI.createBlock({
      location: { 'parent-uid': page_uid, order: i },
      block: {
        string: `((${x.uid}))`,
      },
    })
  })
}

const getRoamDate = (d) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  let text = 'Month Dth, YYYY' // default format

  const date = new Date(d)
  date.setHours(12, 0, 0, 0)

  // YYYY
  text = text.replace(/YYYY/g, () => date.getFullYear())

  // Month
  text = text.replace(/Month/g, () => months[date.getMonth()])

  // D
  text = text.replace(/D(?!e)/g, () => date.getDate())

  // th
  text = text.replace(/(\d+)\s*(th|st|nd|rd)/g, (_, number) => {
    const str = number.substr(-2)
    let suffix

    switch (str.substr(-1)) {
      case '1':
        suffix = 'st'
        break
      case '2':
        suffix = 'nd'
        break
      case '3':
        suffix = 'rd'
        break
      default:
        suffix = 'th'
    }

    // th for all `1X` numbers
    if (str.length > 1 && str[0] == 1) {
      suffix = 'th'
    }
    return number + suffix
  })

  return text
}

// TODO ??
// const openQuickCaptureSidebar = async () => {
//   const yesterdaysQuickCapture = window.roamAlphaAPI
//     .q(
//       `[:find ?u ?s :where
//             [?r :block/uid ?u] [?r :block/string ?s]
//               (or-join [?r ?d]
//                 (and [?r :block/refs ?d])
//                 (and [?r :block/page ?d])
//                 (and [?r :block/parents ?c] [?c :block/refs ?d])
//                 (and [?c :block/refs ?d] [?c :block/parents ?r])
//               )
//             [?r :block/refs ?p] [?p :node/title "TODO"] [?d :node/title "${today}"]
//         ]`
//     )
//     .map(([uid, text]) => ({ uid, text }))

//   console.log('yesterdaysQuickCapture', yesterdaysQuickCapture[0].uid)

//   // await window.roamAlphaAPI.ui.rightSidebar.addWindow({
//   //   window: { type: 'block', 'block-uid': yesterdaysQuickCapture[0].uid },
//   // })
// }

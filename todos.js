// stole these fns from roam/js, mostly wanted the queries
// https://github.com/dvargas92495/roamjs-smartblocks/blob/9ca306e9299f7c015733aa86d258f144ea82f867/src/smartblocks.ts#L441
//
// TODO
// - make it work

if (window.agendaBtn) {
  document.removeEventListener(agendaBtn.handleClick)
} else {
  window.agendaBtn = {}
}

agendaBtn.handleClick = async (e) => {
  if (e.target.tagName === 'BUTTON') {
    const block = e.target.closest('.roam-block')

    if (!block) return

    const uid = block.id.substring(block.id.length - 9)
    const content = await window.roamAlphaAPI
      .q(`[:find (pull ?block [:block/string]) 
          :where [?block :block/uid "${uid}"]]`)[0][0].string

    if (!content) return

    const btnRegExp = /^(\{\{Daily Agenda\}\})(.*)/
    const result = btnRegExp.exec(content)

    if (!result) return

    const [_, btnText] = result

    if (btnText === `{{Daily Agenda}}`) {
      addData(uid)
    }
  }
}

document.addEventListener('click', agendaBtn.handleClick, false)

const getTodayTodos = () => {
  const today = getRoamDate(new Date())

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

const addData = async (uid) => {
  const todos = getTodayTodos()

  if (todos.length > 0) {
    writeTodos(todos, uid)
  } else {
    console.log(`Daily Agenda :: No Results`)
  }
}

const writeTodos = (todos, page_uid) => {
  window.roamAlphaAPI.updateBlock({
    block: {
      uid: page_uid,
      string: `[[agenda]]`,
    },
  })

  todos.map((x, i) => {
    window.roamAlphaAPI.createBlock({
      location: { 'parent-uid': page_uid, order: i },
      block: {
        string: `((${x.uid}))`,
      },
    })
  })
}

const getRoamDate = (dt) => {
  // Month Dth, YYYY
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
  const date = new Date(dt)
  date.setHours(12, 0, 0, 0)
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  // YYYY
  text = text.replace(/YYYY/g, function () {
    return date.getFullYear()
  })

  // Month
  text = text.replace(/Month/g, function () {
    return months[date.getMonth()]
  })

  // D
  text = text.replace(/D(?!e)/g, function () {
    return date.getDate()
  })

  // th
  text = text.replace(/(\d+)\s*(th|st|nd|rd)/g, function (_, number) {
    var str = number.substr(-2)
    var suffix
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

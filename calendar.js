if (window.calendarListener) {
  document.removeEventListener('keydown', window.calendarListener)
} else {
  window.calendarListener = {}
}

window.calendarListener = ({ ctrlKey, shiftKey, keyCode }) => {
  // Use `ctrl + shift + c` to activate
  if (ctrlKey && shiftKey && keyCode === 67) {
    const el = document.querySelector('.bp3-popover-wrapper .bp3-icon-calendar')

    el.click()
  }
}

document.addEventListener('keydown', window.calendarListener, false)

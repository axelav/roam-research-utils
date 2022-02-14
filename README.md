# `roam-research-utils`

A collection of utilities (mostly buttons) for Roam Research. These all use
Roam's experimental [Alpha
API](https://roamresearch.com/#/app/developer-documentation/page/tIaOPdXCj) and
as such may break at any time.

## Installation

Most of these utilities follow the same installation steps.

1. Create a new block in your graph with the text `{{[[roam/js]]}}`.
2. Click "Yes, I know what I'm doing".
3. Create a new block as a child.
4. Type a backslash (`/`), then select the "Javascript Code Block" option.
5. Paste the code from the utility's file into the new block; eg. paste all of
   the text in the file `weather.js` if you are installing the `{{Daily Weather}}` utility.

Some utilities require an API token or additional user data to work properly.
Please see any additional installation notes in the utility file you are
installing.

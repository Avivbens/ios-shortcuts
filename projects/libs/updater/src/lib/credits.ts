import { type Action, comment } from '@ios-shortcuts/shortcut';

const CREDITS =
  'Created with ❤️ by avivbens\n\nhttps://github.com/Avivbens\n\n\nAll iOS Shortcuts\n\nhttps://github.com/Avivbens/ios-shortcuts';

export function credits(): Action {
  return comment(CREDITS);
}

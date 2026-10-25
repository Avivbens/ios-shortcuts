import { type Action, comment } from '@ios-shortcuts/shortcut';

const CREDITS = `
Created with ❤️ by avivbens
https://github.com/Avivbens


All iOS Shortcuts
https://github.com/Avivbens/ios-shortcuts`.trim();

export function credits(): Action {
  return comment(CREDITS);
}

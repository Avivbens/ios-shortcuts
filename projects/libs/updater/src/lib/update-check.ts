import { NAME_VARIABLE, type ShortcutContext, VERSION_VARIABLE } from '@ios-shortcuts/builder';
import {
  type Step,
  type TextTemplate,
  comment,
  exit,
  getContentsOfUrl,
  getDictionaryValue,
  getTextFromInput,
  getWebPageContents,
  ifEquals,
  menu,
  openUrl,
  outputOf,
  randomNumber,
  setVariable,
  text,
  textAction,
  url,
  variable,
} from '@ios-shortcuts/shortcut';

/** Installed copies fetch this exact URL, so the manifest must stay at the root of `master`. */
const MANIFEST_URL = 'https://raw.githubusercontent.com/Avivbens/ios-shortcuts/refs/heads/master/shortcuts.json';

const SHORTCUT_VERSION = variable(VERSION_VARIABLE);
const SHORTCUT_NAME = variable(NAME_VARIABLE);
const SHORTCUT_DATA = variable('shortcutData');
const LATEST_VERSION = variable('latestVersion');
const DOWNLOAD_LINK = variable('shortcutDownloadLink');
const SHOULD_UPDATE = variable('shouldUpdate');

/** Shortcuts has no version compare, so a web page runs this script and prints whether to update. */
function toCompareScript(): TextTemplate {
  return text`<script>
const latest = '${LATEST_VERSION}'
const current = '${SHORTCUT_VERSION}'

const latestValues = latest.split('.')
const currentValues = current.split('.')

const shouldUpdate = latestValues.reduce((acc, _, index) => {
  if (acc) {
    return acc
  }

  if (latestValues[index] > currentValues[index]) {
    return true
  }

  return acc
}, false)

document.write(shouldUpdate);

</script>`;
}

/** About one run in eleven looks the shortcut up by `name` in `shortcuts.json` and offers the newer download. */
export function updateCheck({ name, version }: ShortcutContext & { name: string }): Step[] {
  const shortcutVersion = textAction(version);
  const shortcutName = textAction(name);
  const roll = randomNumber({ minimum: 0, maximum: 10 });
  const manifest = getContentsOfUrl(MANIFEST_URL);
  const entry = getDictionaryValue(outputOf(manifest), text`${SHORTCUT_NAME}`, { valueType: 'Value' });
  const latestVersion = getDictionaryValue(SHORTCUT_DATA, 'version');
  const downloadLink = getDictionaryValue(SHORTCUT_DATA, 'download', { valueType: 'Value' });
  const script = textAction(toCompareScript(), { name: 'JavaScript' });
  const page = url(text`data:text/html,${outputOf(script)}`);
  const pageContents = getWebPageContents(text`${outputOf(page)}`);
  const verdict = getTextFromInput(outputOf(pageContents), { name: 'Better Device Info' });

  return [
    shortcutVersion,
    setVariable(SHORTCUT_VERSION, outputOf(shortcutVersion)),
    shortcutName,
    setVariable(SHORTCUT_NAME, outputOf(shortcutName)),
    comment('Versioning system'),
    roll,
    ifEquals(outputOf(roll), 5, [
      manifest,
      entry,
      setVariable(SHORTCUT_DATA, outputOf(entry)),
      latestVersion,
      setVariable(LATEST_VERSION, outputOf(latestVersion)),
      downloadLink,
      setVariable(DOWNLOAD_LINK, outputOf(downloadLink)),
      script,
      page,
      pageContents,
      verdict,
      setVariable(SHOULD_UPDATE, outputOf(verdict)),
      ifEquals(SHOULD_UPDATE, 'true', [
        menu('An update available! Would you like to update?', [
          ['Yes', [openUrl(DOWNLOAD_LINK), exit()]],
          ['No', []],
        ]),
      ]),
    ]),
  ];
}

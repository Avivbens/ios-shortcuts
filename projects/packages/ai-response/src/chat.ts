import {
  type MenuItem,
  type Step,
  type TextTemplate,
  askChatGpt,
  chooseFromList,
  comment,
  extractTextFromImage,
  menu,
  outputOf,
  replaceText,
  setClipboard,
  setVariable,
  splitText,
  takeScreenshot,
  text,
  textAction,
  trimWhitespace,
} from '@ios-shortcuts/shortcut';
import {
  CLEAN_CONTEXT,
  CONTEXT,
  FIXED_DATA,
  LAST_MESSAGE,
  NUM_OF_RESULTS,
  OPTIONS,
  RESULTS,
  SELECTED_TONE,
} from './variables';

type Tone = [title: string, description: string];

const TONES: Tone[] = [
  [
    'Natural',
    'Natural - Straightforward and genuine, using simple, unembellished language that feels authentic and relatable',
  ],
  [
    'Casual',
    'Casual - Easygoing and approachable, with a friendly, conversational style that feels natural and informal',
  ],
  [
    'Professional',
    'Professional - Clear, polished, and respectful, delivering information with a confident and businesslike tone',
  ],
  [
    'Flirty',
    'Flirt - Playful, confident, and suggestive, using captivating language to create intrigue and attraction',
  ],
];

/** The marker ChatGPT is told to put between suggestions, which the reply picker splits on. */
const SUGGESTION_SEPARATOR = '$$$$$';

function toSenderItem(sender: string): MenuItem {
  const value = textAction(sender);

  return [sender, [value, setVariable(LAST_MESSAGE, outputOf(value))]];
}

function toToneItem([title, description]: Tone): MenuItem {
  const tone = textAction(description);

  return [title, [tone, setVariable(SELECTED_TONE, outputOf(tone))]];
}

function toLabelPrompt(): TextTemplate {
  return text`You are given text extracted from a screenshot of a chat conversation. There are only two possible senders for each message: ME or THEM.

1. The text may include extra lines that are not actual messages (e.g., placeholders, timestamps, or partial/quoted replies). Ignore these lines or remove them from your final output.

2. The last message in the conversation is always from ${LAST_MESSAGE}, unless the last line is just a text input placeholder or another non-message line; in that case, the line before that is the last message from ${LAST_MESSAGE}.

3. Label each actual message from the conversation in chronological order as either:
• ME: the message text
• THEM: the message text

4. Provide your output strictly as lines of text with these labels, with no extra explanations or formatting (like numbers or bullet points).

Important:
• Make sure that the final actual message (not a placeholder or system prompt) is attributed to ${LAST_MESSAGE}.
• If any line is ambiguous or obviously not part of the user conversation, skip it in the final output.

<Data>
${CLEAN_CONTEXT}
</Data>`;
}

function toSuggestionsPrompt(): TextTemplate {
  return text`You are helping me respond to a text chat.
Here is the current context from my screen:

<Data>
${FIXED_DATA}
</Data>

-----------------

1. Review the context carefully.

2. Provide ${NUM_OF_RESULTS} possible responses.

3. Maintain the following tone throughout your suggestions:
${SELECTED_TONE}

4. If you detect that the conversation has ended, propose a new conversation starter that follows the same tone. It can be related or unrelated to the previous context, as long as it respects the required tone.

5. Output only the suggestions—no explanations or additional text. Separate each suggestion with: ${SUGGESTION_SEPARATOR}

6. Do not number or bullet the suggestions.

Remember: Output strictly the suggestions, in plain text, each separated by ${SUGGESTION_SEPARATOR}.`;
}

/** Reads the chat on screen, asks ChatGPT for replies in the chosen tone, and copies the one picked. */
export function chat(): Step[] {
  const screenshot = takeScreenshot();
  const screenText = extractTextFromImage(outputOf(screenshot));
  const cleanContext = replaceText(text`${CONTEXT}`, { find: 'Message...' });
  const labelPrompt = textAction(toLabelPrompt());
  const labeled = askChatGpt({ prompt: text`${outputOf(labelPrompt)}` });
  const suggestionsPrompt = textAction(toSuggestionsPrompt());
  const suggestions = askChatGpt({
    prompt: text`${outputOf(suggestionsPrompt)}`,
    model: { identifier: 'gpt-4o', name: 'GPT-4o' },
    continuous: false,
    newChat: false,
  });
  const options = splitText(RESULTS, { separator: SUGGESTION_SEPARATOR });
  const reply = chooseFromList(OPTIONS);
  const trimmedReply = trimWhitespace(text`${outputOf(reply)}`);

  return [
    screenshot,
    screenText,
    setVariable(CONTEXT, outputOf(screenText)),
    comment('Additional details about the chat'),
    menu('Who sent the last message?', ['Me', 'Them'].map(toSenderItem)),
    comment('Tone setup - support multiple tones options'),
    menu('Choose tone', TONES.map(toToneItem)),
    comment('Enrich text - add messages context'),
    cleanContext,
    setVariable(CLEAN_CONTEXT, outputOf(cleanContext)),
    labelPrompt,
    labeled,
    setVariable(FIXED_DATA, outputOf(labeled)),
    comment('Prompt GPT - get an AI-suggested response'),
    suggestionsPrompt,
    suggestions,
    setVariable(RESULTS, outputOf(suggestions)),
    comment('Parse results from GPT'),
    options,
    setVariable(OPTIONS, outputOf(options)),
    reply,
    comment('Copy selected response'),
    trimmedReply,
    setClipboard(outputOf(trimmedReply)),
  ];
}

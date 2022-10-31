import { actionOutput, buildShortcut, withVariables } from '@joshfarrant/shortcuts-js'
import { showResult, text } from '@joshfarrant/shortcuts-js/build/actions'
import WFWorkflowAction from '@joshfarrant/shortcuts-js/build/interfaces/WF/WFWorkflowAction'
import { createIOSShortcut } from './config/ios-creator'
(async () => {
    // We'll use this later to reference the output of a calculation
    const output = actionOutput()

    // Define our list of actions
    const actions: WFWorkflowAction[] = [
        // Assign the value to the output
        <WFWorkflowAction>text(
            {
                text: 'Hello, World!',
            },
            output
        ),
        showResult({
            text: withVariables`${output}`,
        }),
    ]

    // Generate the Shortcut data
    const shortcut = buildShortcut(actions)

    await createIOSShortcut('example', shortcut)
})()

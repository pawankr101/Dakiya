import { createInterface } from 'node:readline/promises';
import { Guards } from '@dakiya/utils';

export interface PromptOptions {
    /** The question to display to the user */
    question: string;
    /** The expected answer(s) to resolve to true. Defaults to ['yes', 'y'] */
    expectedAnswer?: string | string[];
    /** Whether the answer should be case-sensitive. Defaults to false */
    caseSensitive?: boolean;
}

/**
 * Prompts the user for input in the terminal and returns a boolean based on their answer.
 *
 * @param options A string question or a configuration object.
 * @returns {Promise<boolean>} True if the user's answer matches the expected answer(s).
 */
export const askForConfirmation = async (options: string | PromptOptions): Promise<boolean> => {
    const questionText = typeof options === 'string' ? options : options.question;
    const expected = typeof options === 'string'
        ? ['yes', 'y']
        : (Guards.isArray(options.expectedAnswer) ? options.expectedAnswer : [options.expectedAnswer ?? 'yes']);
    const isCaseSensitive = typeof options === 'string' ? false : (options.caseSensitive ?? false);

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
        const answer = await rl.question(questionText);

        // Normalize the answer and expected values based on case sensitivity
        const normalizedAnswer = isCaseSensitive ? answer.trim() : answer.trim().toLowerCase();
        const normalizedExpected = expected.map(e => isCaseSensitive ? e : e.toLowerCase());

        return normalizedExpected.includes(normalizedAnswer);
    } catch (error) {
        console.error('Error while asking for confirmation:', error);
        return false;
    } finally {
        rl.close();
    }
};

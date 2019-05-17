'use strict';

import * as core from '../src/core';
import * as os from 'os';

describe('@actions/core', () => {
    beforeAll(() => {
        // Set inputs
        process.env['INPUT_MY_INPUT'] = 'val';
        process.env['INPUT_MISSING'] = '';
        process.env['INPUT_SPECIAL_CHARS_\'\t\"\\'] = '\'\t\"\\ repsonse ';
    });

    it('getInput gets non-required input', () => {
        expect(core.getInput('my input')).toBe('val');
    });

    it('getInput gets required input', () => {
        expect(core.getInput('my input', {required: true})).toBe('val');
    });

    it('getInput throws on missing required input', () => {
        expect(() => core.getInput('missing', {required: true})).toThrow('Failed to find input missing');
    });

    it('getInput doesnt throw on missing non-required input', () => {
        expect(core.getInput('missing', {required: false})).toBe('');
    });

    it('getInput is case insensitive', () => {
        expect(core.getInput('My InPuT')).toBe('val');
    });

    it('getInput handles special characters', () => {
        expect(core.getInput('special chars_\'\t\"\\')).toBe('\'\t\"\\ repsonse');
    });

    it('setNeutral sets the correct exit code', () => {
        core.setFailed('Failure message');
        expect(process.exitCode).toBe(1);
    });

    it('setFailure sets the correct exit code and failure message', () => {
        // Override stdout and append to output so that we capture the command that is sent
        let output = '';
        process.stdout.write = (p1: string | Buffer | Uint8Array, p2?: string | ((err?: Error) => void), p3?: (err?: Error) => void): boolean => {
            output += p1;
            return true;
        }

        core.setFailed('Failure message');
        expect(process.exitCode).toBe(1);
        expect(output).toBe('##[error]Failure message' + os.EOL);
    });

    it('error sets the correct error message', () => {
        // Override stdout and append to output so that we capture the command that is sent
        let output = '';
        process.stdout.write = (p1: string | Buffer | Uint8Array, p2?: string | ((err?: Error) => void), p3?: (err?: Error) => void): boolean => {
            output += p1;
            return true;
        }

        core.error('Error message');
        expect(output).toBe('##[error]Error message' + os.EOL);
    });

    it('warning sets the correct message', () => {
        // Override stdout and append to output so that we capture the command that is sent
        let output = '';
        process.stdout.write = (p1: string | Buffer | Uint8Array, p2?: string | ((err?: Error) => void), p3?: (err?: Error) => void): boolean => {
            output += p1;
            return true;
        }

        core.warning('Warning');
        expect(output).toBe('##[warning]Warning' + os.EOL);
    });

    it('debug sets the correct message', () => {
        // Override stdout and append to output so that we capture the command that is sent
        let output = '';
        process.stdout.write = (p1: string | Buffer | Uint8Array, p2?: string | ((err?: Error) => void), p3?: (err?: Error) => void): boolean => {
            output += p1;
            return true;
        }

        core.debug('Debug');
        expect(output).toBe('##[debug]Debug' + os.EOL);
    });

    // TODO - test escaping for all commands
});
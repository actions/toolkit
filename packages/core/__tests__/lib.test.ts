'use strict';

import * as core from '../src/core';
import * as os from 'os';

describe('@actions/core', () => {
    beforeEach(() => {
        // Clear variables
        process.env['my var'] = '';
        process.env['special char var \r\n];'] = '';
        process.env['my var2'] = '';
        process.env['my secret'] = '';
        process.env['special char secret \r\n];'] = '';
        process.env['my secret2'] = '';

        // Set inputs
        process.env['INPUT_MY_INPUT'] = 'val';
        process.env['INPUT_MISSING'] = '';
        process.env['INPUT_SPECIAL_CHARS_\'\t\"\\'] = '\'\t\"\\ repsonse ';
    });

    it('exportVariable produces the correct command and sets the env', () => {
        // Override stdout and append to output so that we capture the command that is sent
        let output = '';
        process.stdout.write = (p1: string | Buffer | Uint8Array, p2?: string | ((err?: Error) => void), p3?: (err?: Error) => void): boolean => {
            output += p1;
            return true;
        }

        core.exportVariable('my var', 'var val');
        expect(process.env['my var']).toBe('var val');
        expect(output).toBe('##[set-variable name=my var;]var val' + os.EOL);
    });

    it('exportVariable escapes variable names', () => {
        // Override stdout and append to output so that we capture the command that is sent
        let output = '';
        process.stdout.write = (p1: string | Buffer | Uint8Array, p2?: string | ((err?: Error) => void), p3?: (err?: Error) => void): boolean => {
            output += p1;
            return true;
        }

        core.exportVariable('special char var \r\n];', 'special val');
        expect(process.env['special char var \r\n];']).toBe('special val');
        expect(output).toBe('##[set-variable name=special char var %0D%0A%5D%3B;]special val' + os.EOL);
    });

    it('exportVariable escapes variable values', () => {
        // Override stdout and append to output so that we capture the command that is sent
        let output = '';
        process.stdout.write = (p1: string | Buffer | Uint8Array, p2?: string | ((err?: Error) => void), p3?: (err?: Error) => void): boolean => {
            output += p1;
            return true;
        }

        core.exportVariable('my var2', 'var val\r\n');
        expect(process.env['my var2']).toBe('var val\r\n');
        expect(output).toBe('##[set-variable name=my var2;]var val%0D%0A' + os.EOL);
    });

    it('setSecret produces the correct commands and sets the env', () => {
        // Override stdout and append to output so that we capture the command that is sent
        let output = '';
        process.stdout.write = (p1: string | Buffer | Uint8Array, p2?: string | ((err?: Error) => void), p3?: (err?: Error) => void): boolean => {
            output += p1;
            return true;
        }

        core.setSecret('my secret', 'secret val');
        expect(process.env['my secret']).toBe('secret val');
        expect(output).toBe('##[set-variable name=my secret;]secret val' + os.EOL + '##[set-secret]secret val' + os.EOL);
    });

    it('setSecret escapes secret names', () => {
        // Override stdout and append to output so that we capture the command that is sent
        let output = '';
        process.stdout.write = (p1: string | Buffer | Uint8Array, p2?: string | ((err?: Error) => void), p3?: (err?: Error) => void): boolean => {
            output += p1;
            return true;
        }

        core.setSecret('special char secret \r\n];', 'special secret val');
        expect(process.env['special char secret \r\n];']).toBe('special secret val');
        expect(output).toBe('##[set-variable name=special char secret %0D%0A%5D%3B;]special secret val' + os.EOL + '##[set-secret]special secret val' + os.EOL);
    });

    it('setSecret escapes secret values', () => {
        // Override stdout and append to output so that we capture the command that is sent
        let output = '';
        process.stdout.write = (p1: string | Buffer | Uint8Array, p2?: string | ((err?: Error) => void), p3?: (err?: Error) => void): boolean => {
            output += p1;
            return true;
        }

        core.setSecret('my secret2', 'secret val\r\n');
        expect(process.env['my secret2']).toBe('secret val\r\n');
        expect(output).toBe('##[set-variable name=my secret2;]secret val%0D%0A' + os.EOL + '##[set-secret]secret val%0D%0A' + os.EOL);
    });

    it('getInput gets non-required input', () => {
        expect(core.getInput('my input')).toBe('val');
    });

    it('getInput gets required input', () => {
        expect(core.getInput('my input', {required: true})).toBe('val');
    });

    it('getInput throws on missing required input', () => {
        expect(() => core.getInput('missing', {required: true})).toThrow('Input required and not supplied: missing');
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

    it('setFailure escapes the failure message', () => {
        // Override stdout and append to output so that we capture the command that is sent
        let output = '';
        process.stdout.write = (p1: string | Buffer | Uint8Array, p2?: string | ((err?: Error) => void), p3?: (err?: Error) => void): boolean => {
            output += p1;
            return true;
        }

        core.setFailed('Failure \r\n\nmessage\r');
        expect(process.exitCode).toBe(1);
        expect(output).toBe('##[error]Failure %0D%0A%0Amessage%0D' + os.EOL);
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

    it('error escapes the error message', () => {
        // Override stdout and append to output so that we capture the command that is sent
        let output = '';
        process.stdout.write = (p1: string | Buffer | Uint8Array, p2?: string | ((err?: Error) => void), p3?: (err?: Error) => void): boolean => {
            output += p1;
            return true;
        }

        core.error('Error message\r\n\n');
        expect(output).toBe('##[error]Error message%0D%0A%0A' + os.EOL);
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

    it('warning escapes the message', () => {
        // Override stdout and append to output so that we capture the command that is sent
        let output = '';
        process.stdout.write = (p1: string | Buffer | Uint8Array, p2?: string | ((err?: Error) => void), p3?: (err?: Error) => void): boolean => {
            output += p1;
            return true;
        }

        core.warning('\r\nwarning\n');
        expect(output).toBe('##[warning]%0D%0Awarning%0A' + os.EOL);
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

    it('debug escapes the message', () => {
        // Override stdout and append to output so that we capture the command that is sent
        let output = '';
        process.stdout.write = (p1: string | Buffer | Uint8Array, p2?: string | ((err?: Error) => void), p3?: (err?: Error) => void): boolean => {
            output += p1;
            return true;
        }

        core.debug('\r\ndebug\n');
        expect(output).toBe('##[debug]%0D%0Adebug%0A' + os.EOL);
    });
});
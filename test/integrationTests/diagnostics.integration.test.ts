/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

import { expect } from 'chai';
import * as path from 'path';
import { activateCSharpExtension } from './integrationHelpers';
import testAssetWorkspace from './testAssets/testAssetWorkspace';

import { Advisor } from '../../src/features/diagnosticsProvider';

const chai = require('chai');
chai.use(require('chai-arrays'));
chai.use(require('chai-fs'));

function setLimit(to: number | null) {
    let csharpConfig = vscode.workspace.getConfiguration('csharp');
    return csharpConfig.update('maxProjectFileCountForDiagnosticAnalysis', to);
}

suite(`Diagnostics Provider ${testAssetWorkspace.description}`, function () {
    let advisor: Advisor;

    suiteSetup(async function () {
        await testAssetWorkspace.restore();
        let activationResult = await activateCSharpExtension();
        if (!activationResult) {
            throw new Error('Cannot activate extension.');
        } else {
            advisor = activationResult.advisor;
        }

        let fileName = 'completion.cs';
        let dir = testAssetWorkspace.projects[0].projectDirectoryPath;
        let fileUri = vscode.Uri.file(path.join(dir, fileName));
        await vscode.commands.executeCommand('vscode.open', fileUri);
    });

    suiteTeardown(async () => {
        await testAssetWorkspace.cleanupWorkspace();
    });

    test('Reports errors from whole project when maxProjectFileCountForDiagnosticAnalysis is higher than the file count', async () => {
        await setLimit(1000);

        expect(advisor.shouldValidateProject()).to.be.true;
    });

    test('Reports errors from individual files when maxProjectFileCountForDiagnosticAnalysis is higher than the file count', async () => {
        await setLimit(1000);

        expect(advisor.shouldValidateFiles()).to.be.true;
    });

    test('Does not report errors from whole project when maxProjectFileCountForDiagnosticAnalysis is lower than the file count', async () => {
        await setLimit(1);

        expect(advisor.shouldValidateProject()).to.be.false;
    });

    test('Reports errors from individual files when maxProjectFileCountForDiagnosticAnalysis is lower than the file count', async () => {
        await setLimit(1);

        expect(advisor.shouldValidateFiles()).to.be.true;
    });

    test('Reports errors from whole project when maxProjectFileCountForDiagnosticAnalysis is null', async () => {
        await setLimit(null);

        expect(advisor.shouldValidateProject()).to.be.true;
    });

    test('Reports errors from individual files when maxProjectFileCountForDiagnosticAnalysis is null', async () => {
        await setLimit(null);

        expect(advisor.shouldValidateFiles()).to.be.true;
    });
});
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { RoslynLanguageServer } from './roslynLanguageServer';
import { RoslynLanguageServerEvents } from './languageServerEvents';
import { languageServerOptions } from '../shared/options';
import { ServerState } from './serverStateChange';
import { getCSharpDevKit } from '../utils/getCSharpDevKit';
import { RazorLanguage } from '../razor/src/razorLanguage';

export function registerLanguageStatusItems(
    context: vscode.ExtensionContext,
    languageServer: RoslynLanguageServer,
    languageServerEvents: RoslynLanguageServerEvents
) {
    // DevKit will provide an equivalent workspace status item.
    if (!getCSharpDevKit()) {
        WorkspaceStatus.createStatusItem(context, languageServerEvents);
    }
    ProjectContextStatus.createStatusItem(context, languageServer);
}

function combineDocumentSelectors(...selectors: vscode.DocumentSelector[]): vscode.DocumentSelector {
    return selectors.reduce<(string | vscode.DocumentFilter)[]>((acc, selector) => acc.concat(selector), []);
}

class WorkspaceStatus {
    static createStatusItem(context: vscode.ExtensionContext, languageServerEvents: RoslynLanguageServerEvents) {
        const documentSelector = combineDocumentSelectors(
            languageServerOptions.documentSelector,
            RazorLanguage.documentSelector
        );
        const item = vscode.languages.createLanguageStatusItem('csharp.workspaceStatus', documentSelector);
        item.name = vscode.l10n.t('C# Workspace Status');
        item.command = {
            command: 'dotnet.openSolution',
            title: vscode.l10n.t('Open solution'),
        };
        context.subscriptions.push(item);

        languageServerEvents.onServerStateChange((e) => {
            item.text = e.workspaceLabel;
            item.busy = e.state === ServerState.ProjectInitializationStarted;
        });
    }
}

class ProjectContextStatus {
    static createStatusItem(context: vscode.ExtensionContext, languageServer: RoslynLanguageServer) {
        const projectContextService = languageServer._projectContextService;

        const item = vscode.languages.createLanguageStatusItem(
            'csharp.projectContextStatus',
            languageServerOptions.documentSelector
        );
        item.name = vscode.l10n.t('C# Project Context Status');
        item.detail = vscode.l10n.t('Active File Context');
        context.subscriptions.push(item);

        projectContextService.onActiveFileContextChanged((e) => {
            item.text = e.context._vs_label;
        });
        projectContextService.refresh();
    }
}

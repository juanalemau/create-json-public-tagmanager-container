import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

function getFiles(dir: string, fileList: string[] = []) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, fileList);
        } else if (file.endsWith('.ts') || file.endsWith('.html')) {
            fileList.push(fullPath);
        }
    });
    return fileList;
}

// Função para extrair diretivas específicas dos comentários
function extractHighlightDirectives(content: string) {
    const regex = /<!--\s*\[appHighlight\]="\{([^}]*)\}"\s*-->/g;
    const matches = [...content.matchAll(regex)];
    const results: any[] = [];

    matches.forEach((match) => {
        const objectContent = match[1];
        const obj: any = {};
        const props = objectContent.split(',').map(prop => prop.trim());

        props.forEach(prop => {
            const [key, value] = prop.split(':').map(p => p.trim());
            if (key && value) {
                obj[key.replace(/['"-]/g, '')] = value.replace(/['"]/g, '');
            }
        });

        results.push(obj);
    });

    return results;
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('create-json-public-tagmanager-container.gerarJsonTagmanager', async () => {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            openLabel: 'Selecione a pasta do projeto',
        });

        if (!folderUri || !folderUri[0]) {
            vscode.window.showErrorMessage('Nenhuma pasta selecionada!');
            return;
        }

        const folderPath = folderUri[0].fsPath;
        const files = getFiles(folderPath);

        let allDirectives: any[] = [];

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const directives = extractHighlightDirectives(content);
            allDirectives.push(...directives);
        }

        if (allDirectives.length === 0) {
            vscode.window.showWarningMessage('Nenhuma diretiva encontrada.');
            return;
        }

        const now = new Date();
        const exportTime = now.toISOString().replace('T', ' ').substring(0, 19);

        let containerVersionId = 0;
        let triggerIdBase = 2147479000;
        let tagIdBase = 5;

        const finalJson: any = {
            exportFormatVersion: 2,
            exportTime: exportTime,
            containerVersion: {
                path: "accounts/6292739777/containers/218712675/versions/0",
                accountId: "6292739777",
                containerId: "218712675",
                containerVersionId: containerVersionId.toString(),
                container: {
                    path: "accounts/6292739777/containers/218712675",
                    accountId: "6292739777",
                    containerId: "218712675",
                    name: "www.testando.com",
                    publicId: "GTM-WW24Q5BZ",
                    usageContext: ["WEB"],
                    fingerprint: now.getTime().toString(),
                    tagManagerUrl: "https://tagmanager.google.com/#/container/accounts/6292739777/containers/218712675/workspaces?apiLink=container",
                    features: {
                        supportUserPermissions: true,
                        supportEnvironments: true,
                        supportWorkspaces: true,
                        supportGtagConfigs: false,
                        supportBuiltInVariables: true,
                        supportClients: false,
                        supportFolders: true,
                        supportTags: true,
                        supportTemplates: true,
                        supportTriggers: true,
                        supportVariables: true,
                        supportVersions: true,
                        supportZones: true,
                        supportTransformations: false
                    },
                    tagIds: ["GTM-WW24Q5BZ"]
                },
                tag: [],
                trigger: [],
                variable: [],
                builtInVariable: []
            }
        };

        for (const directive of allDirectives) {
            const triggerId = (++triggerIdBase).toString();
            const tagId = (++tagIdBase).toString();

            // Cria trigger
            finalJson.containerVersion.trigger.push({
                accountId: "6292739777",
                containerId: "218712675",
                triggerId: triggerId,
                name: `Trigger - ${directive['nome'] || 'Unnamed'}`,
                type: "PAGEVIEW",
                fingerprint: now.getTime().toString()
            });

            // Cria tag
            finalJson.containerVersion.tag.push({
                accountId: "6292739777",
                containerId: "218712675",
                tagId: tagId,
                name: `Tag - ${directive['nome'] || 'Unnamed'}`,
                type: "gaawe",
                parameter: [
                    {
                        type: "TEMPLATE",
                        key: "nome",
                        value: directive['nome'] || ''
                    },
                    {
                        type: "TEMPLATE",
                        key: "descricao",
                        value: directive['descricao'] || ''
                    },
                    {
                        type: "TEMPLATE",
                        key: "tipo",
                        value: directive['tipo'] || ''
                    },
                    {
                        type: "TEMPLATE",
                        key: "servico",
                        value: directive['servico'] || ''
                    }
                ],
                fingerprint: now.getTime().toString(),
                firingTriggerId: [triggerId],
                tagFiringOption: "ONCE_PER_EVENT",
                monitoringMetadata: {
                    type: "MAP"
                },
                consentSettings: {
                    consentStatus: "NOT_SET"
                }
            });
        }

        const outputFilePath = path.join(folderPath, 'tagmanager_generated.json');
        fs.writeFileSync(outputFilePath, JSON.stringify(finalJson, null, 2));

        vscode.window.showInformationMessage(`Arquivo JSON gerado em: ${outputFilePath}`);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

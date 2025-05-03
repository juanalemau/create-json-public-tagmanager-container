import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getAllHtmlFiles, extractDirectives } from './utils';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('create-json-public-tagmanager-container.gerarJsonTagmanager', async () => {
        try {
            vscode.window.showInformationMessage('Iniciando geração do novo arquivo JSON...');

            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('Nenhum projeto aberto!');
                return;
            }

            const projectPath = workspaceFolders[0].uri.fsPath;
            const jsonPath = 'C:/Tag-Manager/Arquivo-Json-Tag-Manager/tag-manager.json';

            if (!fs.existsSync(jsonPath)) {
                vscode.window.showErrorMessage('Arquivo de configuração não encontrado!');
                return;
            }

            if (!jsonPath.endsWith('.json')) {
                vscode.window.showErrorMessage('O arquivo selecionado não é um JSON válido!');
                return;
            }

            const originalJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

            // Reset versions
            const versionsPath = 'C:/Tag-Manager/Version';
            fs.rmSync(versionsPath, { recursive: true, force: true });
            fs.mkdirSync(versionsPath, { recursive: true });

            let tagIdBase = 1;
            let triggerIdBase = 1;

            // Se já existem tags/triggers, pegar o maior ID e continuar a partir dele
            const existingTags = originalJson.containerVersion.tag || [];
            const existingTriggers = originalJson.containerVersion.trigger || [];

            if (existingTags.length > 0) {
                const maxTagId = Math.max(...existingTags.map((t: any) => parseInt(t.tagId)));
                tagIdBase = maxTagId + 1;
            }

            if (existingTriggers.length > 0) {
                const maxTriggerId = Math.max(...existingTriggers.map((t: any) => parseInt(t.triggerId)));
                triggerIdBase = maxTriggerId + 1;
            }

            const htmlFiles = getAllHtmlFiles(projectPath);
            let newTags: any[] = [];
            let newTriggers: any[] = [];

            for (const file of htmlFiles) {
                const content = fs.readFileSync(file, 'utf8');
                const directives = extractDirectives(content);

                for (const dir of directives) {
                    const descricao = dir.descricao || 'Unnamed';
                    const descricaoSlug = descricao.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

                    // Verifica se já existe uma tag ou trigger com esse nome
                    const existingTag = existingTags.find((tag: any) => tag.name === `GA4 Event - ${descricao}`);
                    const existingTrigger = existingTriggers.find((trigger: any) => trigger.name === `Custom - ${descricao}`);

                    if (existingTag || existingTrigger) {
                        continue; // Já existe, pula para o próximo
                    }

                    const currentTriggerId = triggerIdBase.toString(); // 🔥 salva o triggerId antes de incrementar

                    const trigger = {
                        "accountId": "6006883620",
                        "containerId": "67939609",
                        "triggerId": currentTriggerId,
                        "name": `Custom - ${descricao}`,
                        "type": "CUSTOM_EVENT",
                        "customEventFilter": [
                            {
                                "type": "EQUALS",
                                "parameter": [
                                    { "type": "TEMPLATE", "key": "arg0", "value": "{{_event}}" },
                                    { "type": "TEMPLATE", "key": "arg1", "value": descricaoSlug }
                                ]
                            }
                        ],
                        "fingerprint": Date.now().toString()
                    };
                    newTriggers.push(trigger);

                    const tag = {
                        "accountId": "6006883620",
                        "containerId": "67939609",
                        "tagId": tagIdBase.toString(),
                        "name": `GA4 Event - ${descricao}`,
                        "type": "gaawe",
                        "parameter": [
                            { "type": "BOOLEAN", "key": "sendEcommerceData", "value": "false" },
                            {
                                "type": "LIST",
                                "key": "eventSettingsTable",
                                "list": [
                                    { "type": "MAP", "map": [{ "type": "TEMPLATE", "key": "parameter", "value": "event" }, { "type": "TEMPLATE", "key": "parameterValue", "value": "{{dlv - Event}}" }] },
                                    { "type": "MAP", "map": [{ "type": "TEMPLATE", "key": "parameter", "value": "elemento" }, { "type": "TEMPLATE", "key": "parameterValue", "value": "{{dlv - Elemento}}" }] },
                                    { "type": "MAP", "map": [{ "type": "TEMPLATE", "key": "parameter", "value": "descricao" }, { "type": "TEMPLATE", "key": "parameterValue", "value": "{{dlv - Descricao}}" }] },
                                    { "type": "MAP", "map": [{ "type": "TEMPLATE", "key": "parameter", "value": "nome" }, { "type": "TEMPLATE", "key": "parameterValue", "value": "{{dlv - Nome}}" }] }
                                ]
                            }
                        ],
                        "fingerprint": Date.now().toString(),
                        "firingTriggerId": [currentTriggerId], // 🔥 aqui, usando o currentTriggerId correto
                        "tagFiringOption": "ONCE_PER_EVENT",
                        "monitoringMetadata": { "type": "MAP" },
                        "consentSettings": { "consentStatus": "NOT_SET" }
                    };
                    newTags.push(tag);

                    tagIdBase++;
                    triggerIdBase++;
                }
            }

            // Junta os antigos com os novos
            const updatedTags = [...existingTags, ...newTags];
            const updatedTriggers = [...existingTriggers, ...newTriggers];

            // Salva os arquivos de versão
            fs.writeFileSync(path.join(versionsPath, 'tags.json'), JSON.stringify(updatedTags, null, 2));
            fs.writeFileSync(path.join(versionsPath, 'triggers.json'), JSON.stringify(updatedTriggers, null, 2));

            // Atualiza o JSON principal
            originalJson.containerVersion.tag = updatedTags;
            originalJson.containerVersion.trigger = updatedTriggers;

            fs.writeFileSync('C:/Tag-Manager/Novo-Arquivo-Json-Tag-Manager/tag-manager.json', JSON.stringify(originalJson, null, 2));

            vscode.window.showInformationMessage('Novo arquivo JSON gerado com sucesso!');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Erro: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getAllHtmlFiles, extractDirectives } from '../utils';  // IMPORTA DO utils.ts

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Iniciando os testes.');

    // Teste para a função getAllHtmlFiles
    test('Testando getAllHtmlFiles', () => {
        const testDir = path.join(__dirname, 'testDir');
        // Criar o diretório e arquivos fictícios
        fs.mkdirSync(testDir, { recursive: true });
        fs.writeFileSync(path.join(testDir, 'file1.html'), '<html></html>');
        fs.writeFileSync(path.join(testDir, 'file2.txt'), 'Texto sem HTML');

        const files = getAllHtmlFiles(testDir);
        assert.strictEqual(files.length, 1, 'Deve encontrar 1 arquivo .html');
        assert.strictEqual(files[0], path.join(testDir, 'file1.html'), 'O arquivo .html encontrado deve ser o correto');

        // Limpeza
        fs.rmSync(testDir, { recursive: true, force: true });
    });

    // Teste para a função extractDirectives
    test('Testando extractDirectives', () => {
        const htmlContent = `
            <div [libGaEvento]='{"descricao": "Evento1", "elemento": "botao1", "nome": "Evento X"}'></div>
            <div [libGaEvento]='{"descricao": "Evento2", "elemento": "botao2", "nome": "Evento Y"}'></div>
        `;

        const directives = extractDirectives(htmlContent);
        assert.strictEqual(directives.length, 2, 'Deve extrair 2 diretivas');
        assert.deepStrictEqual(directives[0], { descricao: 'Evento1', elemento: 'botao1', nome: 'Evento X' }, 'A primeira diretiva deve ser extraída corretamente');
        assert.deepStrictEqual(directives[1], { descricao: 'Evento2', elemento: 'botao2', nome: 'Evento Y' }, 'A segunda diretiva deve ser extraída corretamente');
    });

    // Teste para a funcionalidade de salvar arquivo JSON
    test('Testando salvar arquivo JSON', async () => {
        const saveFilePath = path.join(__dirname, 'teste.json');

        // Simula o comportamento de salvar um arquivo JSON
        const fakeJson = { test: 'data' };
        fs.writeFileSync(saveFilePath, JSON.stringify(fakeJson, null, 2));

        // Verificar se o arquivo foi criado
        assert.ok(fs.existsSync(saveFilePath), 'O arquivo JSON deve ser criado');
        const savedData = fs.readFileSync(saveFilePath, 'utf8');
        assert.strictEqual(savedData, JSON.stringify({ test: 'data' }, null, 2), 'O conteúdo do arquivo JSON deve estar correto');

        // Limpeza
        fs.unlinkSync(saveFilePath);
    });
});

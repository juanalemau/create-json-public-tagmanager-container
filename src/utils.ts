import * as fs from 'fs';
import * as path from 'path';

export function getAllHtmlFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllHtmlFiles(fullPath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(fullPath);
        }
    });
    return fileList;
}

export function extractDirectives(content: string): any[] {
    const regex = /\[libGaEvento\]\s*=\s*"\{([^}]*)\}"/g;
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
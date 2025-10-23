import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONTACTS_PATH = join(__dirname, 'public', 'data', 'contacts.json');

async function readContactsFile() {
    if (!existsSync(CONTACTS_PATH)) {
        await writeFile(CONTACTS_PATH, '[]', 'utf-8');
    }
    const raw = await readFile(CONTACTS_PATH, 'utf-8');
    try {
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Failed to parse contacts.json', error);
        return [];
    }
}

async function writeContactsFile(contacts) {
    await writeFile(CONTACTS_PATH, JSON.stringify(contacts, null, 4), 'utf-8');
}

async function parseJsonBody(req) {
    return await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            if (!data) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(data));
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}

function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
}

function notFound(res) {
    sendJson(res, 404, { error: 'Not found' });
}

function badRequest(res, message = 'Invalid request') {
    sendJson(res, 400, { error: message });
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        fs: {
            strict: false,
        },
    },
    configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith('/api/contacts')) {
                next();
                return;
            }

            const url = new URL(req.url, 'http://localhost');
            const segments = url.pathname.split('/').filter(Boolean);
            const id = segments.length > 2 ? segments[2] : null;

            try {
                if (req.method === 'GET' && segments.length === 2) {
                    const contacts = await readContactsFile();
                    sendJson(res, 200, { contacts });
                    return;
                }

                if (req.method === 'POST' && segments.length === 2) {
                    const body = await parseJsonBody(req).catch(() => null);
                    if (!body || !body.name || !body.phone || !body.email) {
                        badRequest(res, 'Missing required contact fields.');
                        return;
                    }
                    const contacts = await readContactsFile();
                    const contact = {
                        ...body,
                        id: body.id ?? Date.now(),
                    };
                    contacts.unshift(contact);
                    await writeContactsFile(contacts);
                    sendJson(res, 201, { contact });
                    return;
                }

                if (req.method === 'PUT' && segments.length === 3 && id) {
                    const body = await parseJsonBody(req).catch(() => null);
                    if (!body) {
                        badRequest(res, 'Invalid JSON payload.');
                        return;
                    }
                    const contacts = await readContactsFile();
                    const index = contacts.findIndex(
                        (contact) => String(contact.id) === String(id),
                    );
                    if (index === -1) {
                        notFound(res);
                        return;
                    }
                    contacts[index] = { ...contacts[index], ...body, id: contacts[index].id };
                    await writeContactsFile(contacts);
                    sendJson(res, 200, { contact: contacts[index] });
                    return;
                }

                if (req.method === 'DELETE' && segments.length === 3 && id) {
                    const contacts = await readContactsFile();
                    const nextContacts = contacts.filter(
                        (contact) => String(contact.id) !== String(id),
                    );
                    if (nextContacts.length === contacts.length) {
                        notFound(res);
                        return;
                    }
                    await writeContactsFile(nextContacts);
                    sendJson(res, 200, { success: true });
                    return;
                }

                notFound(res);
            } catch (error) {
                console.error('Contacts API error', error);
                sendJson(res, 500, { error: 'Unexpected server error.' });
            }
        });
    },
});

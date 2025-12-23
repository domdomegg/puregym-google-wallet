import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export type StoredUser = {
	email: string;
	puregymAccessToken: string;
	puregymRefreshToken: string;
	puregymTokenExpiresAt: string;
	walletPassObjectId: string | null;
	memberName: string;
	qrCodeData: string;
	qrCodeExpiresAt: string;
	lastRefreshedAt: string;
	createdAt: string;
};

type UsersStore = Record<string, StoredUser>;

function ensureDataDir(): void {
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, {recursive: true});
	}
}

function readUsers(): UsersStore {
	ensureDataDir();
	if (!fs.existsSync(USERS_FILE)) {
		return {};
	}

	const content = fs.readFileSync(USERS_FILE, 'utf-8');
	return JSON.parse(content);
}

function writeUsers(users: UsersStore): void {
	ensureDataDir();
	fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function getUser(email: string): StoredUser | null {
	const users = readUsers();
	return users[email] || null;
}

export function getAllUsers(): StoredUser[] {
	const users = readUsers();
	return Object.values(users);
}

export function saveUser(user: StoredUser): void {
	const users = readUsers();
	users[user.email] = user;
	writeUsers(users);
}

export function updateUser(email: string, updates: Partial<StoredUser>): StoredUser | null {
	const users = readUsers();
	const user = users[email];
	if (!user) {
		return null;
	}

	const updated = {...user, ...updates};
	users[email] = updated;
	writeUsers(users);
	return updated;
}

export function deleteUser(email: string): boolean {
	const users = readUsers();
	if (!users[email]) {
		return false;
	}

	const {[email]: _removed, ...remaining} = users;
	void _removed; // Intentionally unused
	writeUsers(remaining);
	return true;
}

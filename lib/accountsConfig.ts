import fs from 'fs';
import path from 'path';

interface AccountConfig {
  name: string;
  email: string;
  profileUrn: string;
  linkedinProfile?: string;
}

let accountsCache: AccountConfig[] | null = null;

/**
 * Load and cache accounts.json from linkedin-salesnavigator-scraper
 */
export function getAccountsConfig(): AccountConfig[] {
  if (accountsCache) return accountsCache;

  try {
    const accountsPath = path.resolve(
      process.cwd(),
      '../linkedin-salesnavigator-scraper/accounts.json'
    );
    const fileContent = fs.readFileSync(accountsPath, 'utf-8');
    accountsCache = JSON.parse(fileContent);
    return accountsCache || [];
  } catch (error) {
    console.error('Failed to load accounts.json:', error);
    return [];
  }
}

/**
 * Get account name by index
 */
export function getAccountName(accountIndex: number): string | null {
  const accounts = getAccountsConfig();
  return accounts[accountIndex]?.name || null;
}

/**
 * Get LinkedIn profile URL for an account
 * Returns the explicit linkedinProfile if available, otherwise derives from profileUrn
 */
export function getLinkedInProfileUrl(accountIndex: number): string | null {
  const accounts = getAccountsConfig();
  const account = accounts[accountIndex];
  if (!account) return null;

  // Prefer explicit linkedinProfile URL if available
  if (account.linkedinProfile) {
    return account.linkedinProfile;
  }

  // Derive from profileUrn
  if (account.profileUrn) {
    return `https://www.linkedin.com/in/${account.profileUrn}`;
  }

  return null;
}

/**
 * Get account info by index (name and LinkedIn URL)
 */
export function getAccountInfo(accountIndex: number): {
  name: string | null;
  linkedinProfileUrl: string | null;
} {
  return {
    name: getAccountName(accountIndex),
    linkedinProfileUrl: getLinkedInProfileUrl(accountIndex),
  };
}

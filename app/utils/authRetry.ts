/**
 * Authentication retry management for handling 401 responses
 * Stores pending actions and retries them after successful authentication
 */

export interface PendingAction {
  action: string;
  url: string;
  method: string;
  body?: any;
  headers?: HeadersInit;
  timestamp: number;
}

const PENDING_ACTION_KEY = 'pipedrive_pending_action';
const PENDING_ACTION_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Store a pending action to retry after authentication
 */
export function storePendingAction(action: PendingAction): void {
  try {
    localStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(action));
  } catch (error) {
    console.error('Failed to store pending action:', error);
  }
}

/**
 * Retrieve and clear pending action
 */
export function getPendingAction(): PendingAction | null {
  try {
    const stored = localStorage.getItem(PENDING_ACTION_KEY);
    if (!stored) return null;
    
    const action = JSON.parse(stored) as PendingAction;
    
    // Check if action has expired
    if (Date.now() - action.timestamp > PENDING_ACTION_EXPIRY) {
      clearPendingAction();
      return null;
    }
    
    return action;
  } catch (error) {
    console.error('Failed to retrieve pending action:', error);
    return null;
  }
}

/**
 * Clear pending action
 */
export function clearPendingAction(): void {
  try {
    localStorage.removeItem(PENDING_ACTION_KEY);
  } catch (error) {
    console.error('Failed to clear pending action:', error);
  }
}

/**
 * Execute pending action if exists
 */
export async function executePendingAction(): Promise<boolean> {
  const pendingAction = getPendingAction();
  if (!pendingAction) return false;
  
  try {
    // Clear the pending action first to avoid infinite loops
    clearPendingAction();
    
    const response = await fetch(pendingAction.url, {
      method: pendingAction.method,
      headers: pendingAction.headers,
      body: pendingAction.body ? JSON.stringify(pendingAction.body) : undefined,
    });
    
    if (response.ok) {
      console.log('Pending action executed successfully');
      return true;
    } else {
      console.error('Pending action failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error executing pending action:', error);
    return false;
  }
} 
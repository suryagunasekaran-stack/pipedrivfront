// Admin panel type definitions

// Dashboard types
export interface DashboardOverview {
  totalCompanies: number;
  activeCompanies: number;
  totalProjects: number;
  totalSequences: number;
  systemUptime: string;
  currentYear: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
}

export interface AuthConnection {
  pipedrive: {
    connected: boolean;
    companyCount: number;
    lastSync?: string;
  };
  xero: {
    connected: boolean;
    companyCount: number;
    lastSync?: string;
  };
}

export interface DashboardData {
  overview: DashboardOverview;
  companies: {
    authConnections: AuthConnection;
    recentCompanies: CompanyListItem[];
  };
  projects: {
    currentYearActivity: ProjectActivity;
    departmentBreakdown: DepartmentBreakdown[];
  };
  activity: {
    recentActions: AdminAction[];
    actionSummary: ActionSummary;
  };
  health: SystemHealth;
}

// Company types
export interface CompanyCustomFields {
  // Basic custom fields
  projectNumber?: string;
  projectName?: string;
  departmentCode?: string;
  projectManager?: string;
  projectStatus?: string;
  department?: string;
  vesselName?: string;
  salesInCharge?: string;
  location?: string;
  
  // Extended custom fields for Pipedrive integration
  quoteNumber?: string;
  quoteId?: string;
  invoiceNumber?: string;
  invoiceId?: string;
  pendingStatus?: string;
  
  [key: string]: string | undefined;
}

export interface XeroSettings {
  defaultAccountCode?: string;
  defaultTaxType?: string;
  defaultCurrency?: string;
  defaultBrandingTheme?: string;
}

export interface CompanyAuthStatus {
  pipedrive: {
    isConnected: boolean;
    lastSync?: string;
    dealCount?: number;
  };
  xero: {
    isConnected: boolean;
    lastSync?: string;
    invoiceCount?: number;
  };
}

export interface CompanyAuthTokens {
  pipedrive?: {
    hasToken: boolean;
    isActive: boolean;
    lastUsed?: string;
    expiresAt?: string;
  };
  xero?: {
    hasToken: boolean;
    isActive: boolean;
    lastUsed?: string;
    expiresAt?: string;
  };
}

export interface CompanyStatistics {
  totalProjects: number;
  activeSequences?: number;
  lastProjectCreated?: string;
  recentProjectsCount?: number;
  lastProjectDate?: string;
  departmentDistribution?: Record<string, number>;
}

export interface CompanyListItem {
  companyId: string;
  companyName?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  authStatus: CompanyAuthStatus;
  customFieldsStatus: 'complete' | 'partial' | 'empty';
  projectCount?: number;
}

export interface CompanyDetail {
  _id?: string;
  companyId: string;
  companyName?: string;
  isActive?: boolean;
  customFields: CompanyCustomFields;
  authTokens?: CompanyAuthTokens;
  xeroSettings?: XeroSettings;
  statistics: CompanyStatistics;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyCreateData {
  companyId: string;
  configData: {
    customFields: CompanyCustomFields;
    xeroSettings?: XeroSettings;
  };
}

export interface CompanyUpdateData {
  customFields?: CompanyCustomFields;
  xeroSettings?: XeroSettings;
}

// Project Sequence types
export interface ProjectSequence {
  departmentCode: string;
  year: number;
  lastSequenceNumber: number;
  createdAt: string;
  updatedAt: string;
  projectCount: number;
  lastProjectCreated: string;
  lastProjectNumber: string;
  efficiency: string;
  departmentName: string;
  formattedYear: string;
  nextSequence: number;
}

export interface DepartmentMapping {
  name: string;
  code: string;
}

export interface SequencesByYear {
  currentYear: {
    year: number;
    sequences: ProjectSequence[];
  };
  previousYears: Record<string, ProjectSequence[]>;
  departmentMappings: DepartmentMapping[];
  totalSequences: number;
}

// Activity types
export interface AdminAction {
  id: string;
  timestamp: string;
  actionType: 'login' | 'logout' | 'update_company' | 'update_sequence' | 'reset_sequence' | 'bulk_update' | 'view_data';
  target?: string;
  targetType?: 'company' | 'sequence' | 'system';
  success: boolean;
  message?: string;
  performedBy: string;
  metadata?: Record<string, any>;
}

export interface ActionSummary {
  totalActions: number;
  successRate: number;
  mostCommonAction: string;
  peakHour: number;
  actionsByType: Record<string, number>;
}

export interface ProjectActivity {
  projectsThisMonth: number;
  projectsLastMonth: number;
  growthRate: number;
  averagePerDay: number;
}

export interface DepartmentBreakdown {
  department: string;
  projectCount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

// System Health types
export interface DatabaseHealth {
  status: 'connected' | 'disconnected' | 'error';
  responseTime: number;
  collections: number;
  totalDocuments: number;
}

export interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface SystemHealth {
  database: DatabaseHealth;
  memory: MemoryUsage;
  overallScore: number;
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  lastCheck: string;
}

export interface CollectionDetail {
  name: string;
  documentCount: number;
  sizeInBytes: number;
  indexes: number;
  averageDocumentSize: number;
}

// Form types
export interface LoginFormData {
  password: string;
}

export interface CompanyUpdateFormData {
  customFields?: CompanyCustomFields;
  xeroSettings?: XeroSettings;
}

export interface SequenceUpdateFormData {
  newStartingPoint: number;
}

// Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
} 
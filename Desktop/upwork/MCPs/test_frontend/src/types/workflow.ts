import { Page } from 'puppeteer';

export interface WorkflowConfig {
  baseUrl?: string;
  viewport?: { width: number; height: number };
  timeout?: number;
  headless?: boolean;
  slowMo?: number;
  userAgent?: string;
}

export interface StepOptions {
  waitBefore?: number;
  waitAfter?: number;
  timeout?: number;
  retryCount?: number;
  screenshot?: boolean | ScreenshotOptions;
  continueOnError?: boolean;
}

export interface ScreenshotOptions {
  name?: string;
  fullPage?: boolean;
  quality?: number;
  type?: 'png' | 'jpeg';
  clip?: { x: number; y: number; width: number; height: number };
  highlight?: string[]; // CSS selectors to highlight
}

export type StepType = 
  | 'navigate'
  | 'click'
  | 'type'
  | 'select'
  | 'upload'
  | 'wait'
  | 'waitForSelector'
  | 'scroll'
  | 'hover'
  | 'evaluate'
  | 'screenshot'
  | 'assertText'
  | 'assertVisible'
  | 'assertValue'
  | 'assertNotVisible'
  | 'clear'
  | 'customScript';

export interface TestStep extends StepOptions {
  id?: string;
  type: StepType;
  description?: string;
  selector?: string;
  value?: any;
  url?: string;
  script?: string;
  property?: string;
  expected?: any;
  condition?: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
}

export interface TestWorkflow {
  name: string;
  description?: string;
  version?: string;
  config?: WorkflowConfig;
  variables?: Record<string, any>;
  steps: TestStep[];
  assertions?: Assertion[];
  cleanup?: TestStep[];
}

export interface Assertion {
  selector: string;
  property: string;
  operator?: 'equals' | 'contains' | 'matches' | 'exists';
  expected: any;
  message?: string;
}

export interface StepResult {
  stepId?: string;
  success: boolean;
  error?: Error | string;
  screenshot?: string | Buffer;
  consoleLogs?: ConsoleLog[];
  networkActivity?: NetworkActivity[];
  duration?: number;
  retries?: number;
  data?: any;
}

export interface ConsoleLog {
  timestamp: Date;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  stackTrace?: string;
}

export interface NetworkActivity {
  timestamp: Date;
  method: string;
  url: string;
  status?: number;
  responseTime?: number;
  size?: number;
  error?: string;
}

export interface WorkflowResult {
  workflow: TestWorkflow;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'success' | 'failure' | 'partial';
  steps: StepResult[];
  summary: {
    totalSteps: number;
    passedSteps: number;
    failedSteps: number;
    skippedSteps: number;
  };
  screenshots: string[];
  consoleLogs: ConsoleLog[];
  networkActivity: NetworkActivity[];
  error?: Error | string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  value?: any;
}
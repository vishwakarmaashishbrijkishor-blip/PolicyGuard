import { z } from 'zod';

/** Machine-readable error categories. */
type PolicyGuardErrorCode = "not-a-repository" | "git-failure" | "ref-not-found" | "diff-parse" | "config-invalid" | "config-not-found" | "policy-invalid" | "policy-yaml" | "policy-unknown-rule" | "policy-duplicate-id" | "index-failure" | "rule-failure" | "llm-failure" | "llm-invalid-response" | "io-failure" | "usage";
/** Serializable shape of a {@link PolicyGuardError}. */
interface PolicyGuardErrorJson {
    readonly code: PolicyGuardErrorCode;
    readonly message: string;
    readonly file?: string;
    readonly suggestion?: string;
}
interface PolicyGuardErrorOptions {
    readonly file?: string;
    readonly suggestion?: string;
    readonly cause?: unknown;
}
/**
 * Base error for every failure PolicyGuard reports. Carries a stable code and
 * an optional suggested fix so the CLI can print actionable messages.
 */
declare class PolicyGuardError extends Error {
    readonly code: PolicyGuardErrorCode;
    readonly file?: string;
    readonly suggestion?: string;
    constructor(code: PolicyGuardErrorCode, message: string, options?: PolicyGuardErrorOptions);
    toJSON(): PolicyGuardErrorJson;
}
/** Failure while talking to Git or resolving repository state. */
declare class GitError extends PolicyGuardError {
}
/** Failure while parsing a unified diff. */
declare class DiffParseError extends PolicyGuardError {
    constructor(message: string, options?: PolicyGuardErrorOptions);
}
/** Invalid or unreadable configuration. */
declare class ConfigError extends PolicyGuardError {
}
/** Invalid policy definition or policy file. */
declare class PolicyError extends PolicyGuardError {
}
/** Failure inside the repository indexer. */
declare class IndexError extends PolicyGuardError {
    constructor(message: string, options?: PolicyGuardErrorOptions);
}
/** Failure inside a rule implementation. */
declare class RuleError extends PolicyGuardError {
    constructor(message: string, options?: PolicyGuardErrorOptions);
}
/** Failure in the optional LLM layer. */
declare class LlmError extends PolicyGuardError {
    constructor(code: Extract<PolicyGuardErrorCode, "llm-failure" | "llm-invalid-response">, message: string, options?: PolicyGuardErrorOptions);
}
/** Converts any thrown value into a {@link PolicyGuardError}. */
declare function toPolicyGuardError(value: unknown, fallbackCode?: PolicyGuardErrorCode): PolicyGuardError;

type Severity = "info" | "warning" | "error" | "critical";
type FindingSource = "deterministic" | "llm-assisted";
type Confidence = "low" | "medium" | "high";
type DiffFileStatus = "added" | "modified" | "deleted" | "renamed";
interface DiffLine {
    readonly type: "context" | "added" | "removed";
    readonly oldLineNumber?: number;
    readonly newLineNumber?: number;
    readonly content: string;
}
interface DiffHunk {
    readonly oldStart: number;
    readonly oldLines: number;
    readonly newStart: number;
    readonly newLines: number;
    readonly lines: readonly DiffLine[];
}
interface ChangedFile {
    readonly path: string;
    readonly previousPath?: string;
    readonly status: DiffFileStatus;
    readonly language?: string;
    readonly isBinary: boolean;
    readonly hunks: readonly DiffHunk[];
}
interface Evidence {
    readonly file: string;
    readonly startLine?: number;
    readonly endLine?: number;
    readonly snippet?: string;
    readonly explanation: string;
    readonly source: "diff" | "repository" | "policy" | "test" | "configuration";
}
interface Suppression {
    readonly status: "active" | "suppressed";
    readonly reason?: string;
    readonly author?: string;
    readonly expiresAt?: string;
}
interface Finding {
    readonly id: string;
    readonly ruleId: string;
    readonly policyId?: string;
    readonly title: string;
    readonly message: string;
    readonly severity: Severity;
    readonly confidence: Confidence;
    readonly source: FindingSource;
    readonly file: string;
    readonly startLine?: number;
    readonly endLine?: number;
    readonly evidence: readonly Evidence[];
    readonly remediation?: string;
    readonly suggestedPatch?: string;
    readonly documentationUrl?: string;
    readonly suppression?: Suppression;
}
interface ReviewSummary {
    readonly total: number;
    readonly bySeverity: Record<Severity, number>;
    readonly deterministic: number;
    readonly llmAssisted: number;
    readonly suppressed: number;
}
interface ReviewResult {
    readonly repositoryPath: string;
    readonly baseRef: string;
    readonly headRef: string;
    readonly startedAt: string;
    readonly completedAt: string;
    readonly durationMs: number;
    readonly findings: readonly Finding[];
    readonly summary: ReviewSummary;
    readonly errors: readonly PolicyGuardError[];
}
type OutputFormat = "terminal" | "json" | "sarif";
/** Options accepted by `policyguard review`. */
interface ReviewOptions {
    readonly base?: string;
    readonly head?: string;
    readonly format?: OutputFormat;
    readonly strict: boolean;
    /** `true` = --ai, `false` = --no-ai, `undefined` = use configuration. */
    readonly ai?: boolean;
    readonly configPath?: string;
    readonly outputPath?: string;
    readonly failOn?: Severity;
}

/** Successful result. */
interface Ok<T> {
    readonly ok: true;
    readonly value: T;
}
/** Failed result. */
interface Err<E> {
    readonly ok: false;
    readonly error: E;
}
/** Explicit success-or-failure return type. */
type Result<T, E = Error> = Ok<T> | Err<E>;
declare function ok<T>(value: T): Ok<T>;
declare function err<E>(error: E): Err<E>;
/** Runs `fn` and captures any thrown value as an `Err`. */
declare function tryAsync<T, E>(fn: () => Promise<T>, mapError: (thrown: unknown) => E): Promise<Result<T, E>>;

/** Product name used in output and generated files. */
declare const TOOL_NAME = "policyguard";
/** Tool version, sourced from package.json so it cannot drift. */
declare const TOOL_VERSION: string;

declare const configSchema: z.ZodObject<{
    version: z.ZodNumber;
    project: z.ZodPrefault<z.ZodObject<{
        languages: z.ZodDefault<z.ZodArray<z.ZodString>>;
        packageManager: z.ZodOptional<z.ZodEnum<{
            pnpm: "pnpm";
            npm: "npm";
            yarn: "yarn";
        }>>;
    }, z.core.$strict>>;
    review: z.ZodPrefault<z.ZodObject<{
        defaultBase: z.ZodOptional<z.ZodString>;
        ai: z.ZodPrefault<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            provider: z.ZodDefault<z.ZodEnum<{
                "openai-compatible": "openai-compatible";
            }>>;
            model: z.ZodDefault<z.ZodString>;
            baseUrl: z.ZodOptional<z.ZodURL>;
            apiKeyEnvVar: z.ZodDefault<z.ZodString>;
            maxFilesPerRequest: z.ZodDefault<z.ZodNumber>;
            maxContextChars: z.ZodDefault<z.ZodNumber>;
            redactSecrets: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    paths: z.ZodPrefault<z.ZodObject<{
        ui: z.ZodDefault<z.ZodArray<z.ZodString>>;
        api: z.ZodDefault<z.ZodArray<z.ZodString>>;
        migrations: z.ZodDefault<z.ZodArray<z.ZodString>>;
        protected: z.ZodDefault<z.ZodArray<z.ZodString>>;
        tests: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
    reporting: z.ZodPrefault<z.ZodObject<{
        format: z.ZodDefault<z.ZodEnum<{
            terminal: "terminal";
            json: "json";
            sarif: "sarif";
        }>>;
        failOn: z.ZodDefault<z.ZodEnum<{
            info: "info";
            warning: "warning";
            error: "error";
            critical: "critical";
        }>>;
    }, z.core.$strict>>;
    suppressions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        ruleId: z.ZodOptional<z.ZodString>;
        paths: z.ZodDefault<z.ZodArray<z.ZodString>>;
        reason: z.ZodString;
        author: z.ZodOptional<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
/** Validated PolicyGuard configuration with all defaults applied. */
type PolicyGuardConfig = z.infer<typeof configSchema>;
/** Parses an unknown value as configuration. */
declare function parseConfig(input: unknown, file?: string): Result<PolicyGuardConfig, ConfigError>;
/** Returns the configuration used when no config file exists. */
declare function defaultConfig(): PolicyGuardConfig;
interface LoadedConfig {
    readonly config: PolicyGuardConfig;
    /** Absolute path of the file the config came from, or undefined when defaults are used. */
    readonly sourcePath?: string;
}
/**
 * Loads configuration. An explicit path must exist; otherwise
 * `.policyguard/policyguard.config.json` is optional and defaults apply.
 */
declare function loadConfig(repositoryPath: string, explicitPath?: string): Promise<Result<LoadedConfig, ConfigError>>;

export { ConfigError, DiffParseError, GitError, IndexError, LlmError, PolicyError, PolicyGuardError, RuleError, TOOL_NAME, TOOL_VERSION, defaultConfig, err, loadConfig, ok, parseConfig, toPolicyGuardError, tryAsync };
export type { ChangedFile, Confidence, DiffFileStatus, DiffHunk, DiffLine, Err, Evidence, Finding, FindingSource, Ok, OutputFormat, PolicyGuardConfig, PolicyGuardErrorCode, PolicyGuardErrorJson, PolicyGuardErrorOptions, Result, ReviewOptions, ReviewResult, ReviewSummary, Severity, Suppression };

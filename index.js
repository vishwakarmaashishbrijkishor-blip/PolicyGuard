// src/core/errors.ts
var PolicyGuardError = class extends Error {
  code;
  file;
  suggestion;
  constructor(code, message, options = {}) {
    super(message, options.cause === void 0 ? void 0 : { cause: options.cause });
    this.name = new.target.name;
    this.code = code;
    if (options.file !== void 0) this.file = options.file;
    if (options.suggestion !== void 0) this.suggestion = options.suggestion;
  }
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...this.file === void 0 ? {} : { file: this.file },
      ...this.suggestion === void 0 ? {} : { suggestion: this.suggestion }
    };
  }
};
var GitError = class extends PolicyGuardError {
};
var DiffParseError = class extends PolicyGuardError {
  constructor(message, options = {}) {
    super("diff-parse", message, options);
  }
};
var ConfigError = class extends PolicyGuardError {
};
var PolicyError = class extends PolicyGuardError {
};
var IndexError = class extends PolicyGuardError {
  constructor(message, options = {}) {
    super("index-failure", message, options);
  }
};
var RuleError = class extends PolicyGuardError {
  constructor(message, options = {}) {
    super("rule-failure", message, options);
  }
};
var LlmError = class extends PolicyGuardError {
  constructor(code, message, options = {}) {
    super(code, message, options);
  }
};
function toPolicyGuardError(value, fallbackCode = "io-failure") {
  if (value instanceof PolicyGuardError) return value;
  const message = value instanceof Error ? value.message : String(value);
  return new PolicyGuardError(fallbackCode, message, { cause: value });
}

// src/core/result.ts
function ok(value) {
  return { ok: true, value };
}
function err(error) {
  return { ok: false, error };
}
async function tryAsync(fn, mapError) {
  try {
    return ok(await fn());
  } catch (thrown) {
    return err(mapError(thrown));
  }
}

// package.json
var package_default = {
  name: "policyguard",
  version: "0.1.0",
  description: "Evidence-linked, policy-as-code review engine for AI-assisted software development.",
  license: "MIT",
  type: "module",
  engines: {
    node: ">=20"
  },
  bin: {
    policyguard: "./dist/cli/index.js"
  },
  main: "./dist/index.js",
  types: "./dist/index.d.ts",
  exports: {
    ".": {
      types: "./dist/index.d.ts",
      import: "./dist/index.js"
    }
  },
  files: [
    "dist",
    "policies",
    "action.yml",
    "README.md",
    "LICENSE"
  ],
  keywords: [
    "code-review",
    "policy-as-code",
    "static-analysis",
    "typescript",
    "ai-assisted-development"
  ],
  scripts: {
    build: "tsup",
    dev: "tsup --watch",
    lint: "eslint .",
    format: "prettier --write .",
    "format:check": "prettier --check .",
    typecheck: "tsc --noEmit",
    test: "vitest run",
    "test:watch": "vitest",
    evaluate: "vitest run --config vitest.eval.config.ts",
    demo: "node examples/demo/run-demo.mjs"
  },
  dependencies: {
    "cli-table3": "^0.6.5",
    commander: "^15.1.0",
    picocolors: "^1.1.1",
    picomatch: "^4.0.7",
    "simple-git": "^4.0.2",
    "ts-morph": "^28.0.0",
    yaml: "^2.9.1",
    zod: "^4.6.7"
  },
  devDependencies: {
    "@eslint/js": "^10.0.1",
    "@types/node": "^26.6.6",
    "@types/picomatch": "^4.0.3",
    eslint: "^10.15.0",
    prettier: "^3.10.1",
    tsup: "^9.0.0",
    typescript: "~5.9.3",
    "typescript-eslint": "^8.72.2",
    vitest: "^5.1.0"
  }
};

// src/core/constants.ts
var TOOL_NAME = "policyguard";
var TOOL_VERSION = package_default.version;
var POLICYGUARD_DIR = ".policyguard";
var CONFIG_FILE_NAME = "policyguard.config.json";
var SUPPORTED_CONFIG_VERSION = 1;

// src/core/config.ts
import { z } from "zod";
import { readFile } from "fs/promises";
import path from "path";
var severitySchema = z.enum(["info", "warning", "error", "critical"]);
var suppressionEntrySchema = z.object({
  ruleId: z.string().min(1).optional(),
  paths: z.array(z.string().min(1)).min(1).default(["**"]),
  reason: z.string().trim().min(1, "A suppression must state a reason"),
  author: z.string().min(1).optional(),
  expiresAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "expiresAt must be an ISO 8601 date").optional()
}).strict();
var aiConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(["openai-compatible"]).default("openai-compatible"),
  model: z.string().min(1).default("gpt-4.1-mini"),
  baseUrl: z.url().optional(),
  apiKeyEnvVar: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "apiKeyEnvVar must be an environment variable NAME").default("POLICYGUARD_LLM_API_KEY"),
  maxFilesPerRequest: z.number().int().positive().max(100).default(10),
  maxContextChars: z.number().int().positive().default(24e3),
  redactSecrets: z.boolean().default(true)
}).strict();
var configSchema = z.object({
  version: z.number().int(),
  project: z.object({
    languages: z.array(z.string().min(1)).default(["typescript"]),
    packageManager: z.enum(["pnpm", "npm", "yarn"]).optional()
  }).strict().prefault({}),
  review: z.object({
    defaultBase: z.string().min(1).optional(),
    ai: aiConfigSchema.prefault({})
  }).strict().prefault({}),
  paths: z.object({
    ui: z.array(z.string()).default(["src/app/**", "src/components/**", "src/pages/**", "src/ui/**"]),
    api: z.array(z.string()).default(["src/routes/**", "src/api/**"]),
    migrations: z.array(z.string()).default(["migrations/**", "database/migrations/**", "src/migrations/**"]),
    protected: z.array(z.string()).default([".github/workflows/**", "infra/**", "src/auth/**", "src/crypto/**"]),
    tests: z.array(z.string()).default(["**/*.test.*", "**/*.spec.*", "tests/**", "test/**", "**/__tests__/**"])
  }).strict().prefault({}),
  reporting: z.object({
    format: z.enum(["terminal", "json", "sarif"]).default("terminal"),
    failOn: severitySchema.default("error")
  }).strict().prefault({}),
  suppressions: z.array(suppressionEntrySchema).default([])
}).strict();
function formatZodIssues(error) {
  return error.issues.map((issue) => {
    const location = issue.path.length > 0 ? issue.path.map(String).join(".") : "(root)";
    return `  - ${location}: ${issue.message}`;
  }).join("\n");
}
function parseConfig(input, file) {
  const parsed = configSchema.safeParse(input);
  if (!parsed.success) {
    return err(
      new ConfigError(
        "config-invalid",
        `Invalid configuration:
${formatZodIssues(parsed.error)}`,
        {
          ...file === void 0 ? {} : { file },
          suggestion: "Fix the listed fields. See docs/configuration.md for every option."
        }
      )
    );
  }
  if (parsed.data.version !== SUPPORTED_CONFIG_VERSION) {
    return err(
      new ConfigError(
        "config-invalid",
        `Unsupported configuration version ${parsed.data.version}. Supported: ${SUPPORTED_CONFIG_VERSION}.`,
        { ...file === void 0 ? {} : { file } }
      )
    );
  }
  return ok(parsed.data);
}
function defaultConfig() {
  const result = parseConfig({ version: SUPPORTED_CONFIG_VERSION });
  if (!result.ok) throw result.error;
  return result.value;
}
async function loadConfig(repositoryPath, explicitPath) {
  const target = explicitPath ? path.resolve(repositoryPath, explicitPath) : path.join(repositoryPath, POLICYGUARD_DIR, CONFIG_FILE_NAME);
  let raw;
  try {
    raw = await readFile(target, "utf8");
  } catch (cause) {
    if (explicitPath === void 0 && isNotFound(cause)) return ok({ config: defaultConfig() });
    return err(
      new ConfigError(
        isNotFound(cause) ? "config-not-found" : "config-invalid",
        `Cannot read configuration file: ${target}`,
        { file: target, cause, suggestion: "Check the path or run `policyguard init`." }
      )
    );
  }
  let json;
  try {
    json = JSON.parse(raw);
  } catch (cause) {
    return err(
      new ConfigError("config-invalid", `Configuration is not valid JSON: ${target}`, {
        file: target,
        cause
      })
    );
  }
  const parsed = parseConfig(json, target);
  return parsed.ok ? ok({ config: parsed.value, sourcePath: target }) : parsed;
}
function isNotFound(cause) {
  return cause?.code === "ENOENT";
}
export {
  ConfigError,
  DiffParseError,
  GitError,
  IndexError,
  LlmError,
  PolicyError,
  PolicyGuardError,
  RuleError,
  TOOL_NAME,
  TOOL_VERSION,
  defaultConfig,
  err,
  loadConfig,
  ok,
  parseConfig,
  toPolicyGuardError,
  tryAsync
};
//# sourceMappingURL=index.js.map
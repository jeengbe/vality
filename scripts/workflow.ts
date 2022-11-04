import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";

function* getPackages() {
  const packages = fs.readdirSync(`${__dirname}/../packages`, {
    withFileTypes: true,
  });
  for (const pkg of packages) {
    if (pkg.isDirectory()) {
      yield pkg.name;
    }
  }
}

const workflow = {
  name: "CI",
  on: ["push", "pull_request"],
  env: {
    PRIMARY_NODE_VERSION: 18,
  },
  jobs: {
    install: {
      name: "Checkout and install",
      "runs-on": "ubuntu-latest",
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v3",
        },
        {
          name: "Install dependencies",
          uses: "./.github/actions/setup",
          with: {
            "node-version": "${{ env.PRIMARY_NODE_VERSION }}",
          },
        },
      ],
    },
    "build-docs": {
      name: "Build docs",
      "runs-on": "ubuntu-latest",
      needs: ["install"],
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v3",
        },
        {
          name: "Install dependencies",
          uses: "./.github/actions/setup",
          with: {
            package: "../docs",
            "node-version": "${{ env.PRIMARY_NODE_VERSION }}",
          },
        },
        {
          name: "Restore webpack cache",
          uses: "actions/cache@v3",
          with: {
            path: "docs/node_modules/.cache/webpack",
            key: "docs-webpack-cache",
            "restore-keys": "docs-webpack-cache",
          }
        },
        {
          name: "Build docs",
          run: "pnpm --filter docs run build",
        },
        {
          name: "Cache webpack build",
          uses: "actions/cache@v3",
          with: {
            path: "docs/node_modules/.cache/webpack",
            key: "docs-webpack-cache",
          }
        },
        {
          name: "Upload docs artifact",
          uses: "actions/upload-pages-artifact@v1",
          with: {
            path: "docs/build",
          },
        },
      ],
    },
    "deploy-docs": {
      name: "Deploy docs",
      "runs-on": "ubuntu-latest",
      needs: ["build-docs"],
      permissions: {
        pages: "write",
        "id-token": "write",
      },
      if: "${{ github.event_name == 'push' && github.ref == 'refs/heads/master' }}",
      environment: {
        name: "Docs",
        url: "${{ steps.deployment.outputs.page_url }}"
      },
      concurrency: {
        group: "deploy-docs",
        "cancel-in-progress": true,
      },
      steps: [
        {
          name: "Deploy",
          id: "deployment",
          uses: "actions/deploy-pages@v1"
        },
      ],
    },
  } as Record<string, any>,
};

for (const pkg of getPackages()) {
  Object.assign(workflow.jobs, {
    [`lint-${pkg}`]: {
      name: `Lint: ${pkg}`,
      "runs-on": "ubuntu-latest",
      needs: ["install"],
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v3",
        },
        {
          name: "Install dependencies",
          uses: "./.github/actions/setup",
          with: {
            package: pkg,
            "node-version": "${{ env.PRIMARY_NODE_VERSION }}",
          },
        },
        {
          name: "Lint",
          run: `pnpm --filter ${pkg} run lint`,
        },
      ],
    },
    [`unit-test-${pkg}`]: {
      name: `Unit Test: ${pkg}`,
      "runs-on": "ubuntu-latest",
      needs: ["install"],
      strategy: {
        matrix: {
          "node-version": [14, 16, 18],
        },
      },
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v3",
        },
        {
          name: "Install dependencies",
          uses: "./.github/actions/setup",
          with: {
            package: pkg,
            "node-version": "${{ matrix.node-version }}",
          },
        },
        {
          name: "Test",
          if: "${{ matrix.node-version != env.PRIMARY_NODE_VERSION }}",
          run: `pnpm --filter ${pkg} run test:unit`,
        },
        {
          name: "Test (coverage)",
          if: "${{ matrix.node-version == env.PRIMARY_NODE_VERSION }}",
          run: `pnpm --filter ${pkg} run test:coverage`,
        },
        {
          name: "Upload coverage artifact",
          if: "${{ matrix.node-version == env.PRIMARY_NODE_VERSION }}",
          uses: "actions/upload-artifact@v2",
          with: {
            name: `coverage-${pkg}`,
            path: `./packages/${pkg}/coverage`,
          },
        },
      ],
    },
    [`type-test-${pkg}`]: {
      name: `Type Test: ${pkg}`,
      "runs-on": "ubuntu-latest",
      needs: ["install"],
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v3",
        },
        {
          name: "Install dependencies",
          uses: "./.github/actions/setup",
          with: {
            package: pkg,
            "node-version": "${{ matrix.node-version }}",
          },
        },
        {
          name: "Test",
          if: "${{ matrix.node-version != env.PRIMARY_NODE_VERSION }}",
          run: `pnpm --filter ${pkg} run test:type`,
        },
      ],
    },
    [`typecheck-${pkg}`]: {
      name: `Typecheck: ${pkg}`,
      "runs-on": "ubuntu-latest",
      needs: ["install"],
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v3",
        },
        {
          name: "Install dependencies",
          uses: "./.github/actions/setup",
          with: {
            package: pkg,
            "node-version": "${{ env.PRIMARY_NODE_VERSION }}",
          },
        },
        {
          name: "Typecheck",
          run: `pnpm --filter ${pkg} run typecheck`,
        },
      ],
    },
    [`check-version-${pkg}`]: {
      name: `Check version: ${pkg}`,
      "runs-on": "ubuntu-latest",
      if: "${{ github.event_name == 'push' && github.ref == 'refs/heads/master' }}",
      outputs: {
        "should-publish": "${{ steps.check.outputs.changed }}",
        "current-version": "${{ steps.check.outputs.version }}",
      },
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v3",
        },
        {
          name: "Check for version changes",
          id: "check",
          uses: "EndBug/version-check@v2",
          with: {
            "file-name": `./packages/${pkg}/package.json`,
            "file-url": `https://unpkg.com/${pkg}/package.json`,
            "static-checking": "localIsNew"
          },
        },
      ],
    },
    [`build-${pkg}`]: {
      name: `Build: ${pkg}`,
      "runs-on": "ubuntu-latest",
      needs: [
        `lint-${pkg}`,
        `unit-test-${pkg}`,
        `type-test-${pkg}`,
        `typecheck-${pkg}`,
        `check-version-${pkg}`,
      ],
      if: `\${{ needs.check-version-${pkg}.outputs.should-publish == 'true' }}`,
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v3",
        },
        {
          name: "Install dependencies",
          uses: "./.github/actions/setup",
          with: {
            package: pkg,
            "node-version": "${{ env.PRIMARY_NODE_VERSION }}",
          },
        },
        {
          name: "Build",
          run: `pnpm --filter ${pkg} run build`,
        },
        {
          name: "Upload build artifact",
          uses: "actions/upload-artifact@v2",
          with: {
            name: `build-${pkg}`,
            path: `./packages/${pkg}/dist
./packages/${pkg}/src
./packages/${pkg}/package.json
./packages/${pkg}/README.md
./packages/${pkg}/LICENSE.json`,
          },
        },
      ],
    },
    [`coverage-${pkg}`]: {
      name: `Upload coverage: ${pkg}`,
      "runs-on": "ubuntu-latest",
      needs: [`unit-test-${pkg}`],
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v3",
        },
        {
          name: "Download coverage artifact",
          uses: "actions/download-artifact@v2",
          with: {
            name: `coverage-${pkg}`,
            path: `./packages/${pkg}/coverage`,
          },
        },
        {
          name: "Upload to Codecov",
          uses: "codecov/codecov-action@v3",
          with: {
            files: `./packages/${pkg}/coverage/lcov.info`,
            flags: pkg,
          },
        },
      ],
    },
    [`publish-${pkg}`]: {
      name: `Publish: ${pkg}`,
      "runs-on": "ubuntu-latest",
      needs: [`build-${pkg}`, `check-version-${pkg}`],
      environment: {
        name: `npm: ${pkg}`,
        url: `https://www.npmjs.com/package/${pkg}`,
      },
      steps: [
        {
          name: "Download build artifact",
          uses: "actions/download-artifact@v2",
          with: {
            name: `build-${pkg}`,
            path: `./packages/${pkg}`,
          },
        },
        {
          name: "Add module types to dist/",
          "working-directory": `./packages/${pkg}`,
          run: `echo { "type": "commonjs" } > dist/cjs/package.json
echo { "type": "module" } > dist/esm/package.json`,
        },
        {
          name: "Install Node.js",
          uses: "actions/setup-node@v3",
          with: {
            "node-version": "${{ env.PRIMARY_NODE_VERSION }}",
            "registry-url": "https://registry.npmjs.org",
          },
        },
        {
          name: "Publish to NPM",
          "working-directory": `./packages/${pkg}`,
          run: `npm publish`,
          env: {
            NODE_AUTH_TOKEN: "${{ secrets.NPM_TOKEN }}",
          },
        },
      ],
    },
  });
}

fs.writeFileSync(
  path.resolve(`${__dirname}/../.github/workflows/ci.yml`),
  `# This file is automatically generated, do not edit manually!
# To regenerate it, run 'pnpm run build:workflow'

` + yaml.stringify(workflow)
);

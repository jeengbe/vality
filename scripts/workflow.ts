import * as fs from "fs";
import * as path from "path";
import * as yaml from 'yaml';

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
          uses: "actions/checkout@v2",
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
  } as Record<string, any>,
};

for (const pkg of getPackages()) {
  Object.assign(workflow.jobs, {
    [`lint-${pkg}`]: {
      name: `Lint ${pkg}`,
      "runs-on": "ubuntu-latest",
      needs: ["install"],
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v2",
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
    [`test-${pkg}`]: {
      name: `Test ${pkg}`,
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
          uses: "actions/checkout@v2",
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
          if: "${{ matrix.node-version == env.PRIMARY_NODE_VERSION }}",
          run: `pnpm --filter ${pkg} run test`,
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
    [`typecheck-${pkg}`]: {
      name: `Typecheck ${pkg}`,
      "runs-on": "ubuntu-latest",
      needs: ["install"],
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v2",
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
    [`build-${pkg}`]: {
      name: `Build ${pkg}`,
      "runs-on": "ubuntu-latest",
      needs: [`lint-${pkg}`, `test-${pkg}`, `typecheck-${pkg}`],
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v2",
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
          name: "Replace 'on GitHub' with 'on NPM'",
          run: `sed -i 's/on GitHub/on NPM/g' ./packages/${pkg}/README.md`,
        },
        {
          name: "Upload build artifact",
          uses: "actions/upload-artifact@v2",
          with: {
            name: `build-${pkg}`,
            path: [
              `./packages/${pkg}/dist`,
              `./packages/${pkg}/mjs`,
              `./packages/${pkg}/package.json`,
              `./packages/${pkg}/README.md`,
              `./packages/${pkg}/LICENSE.json`,
            ],
          },
        },
      ],
    },
    [`coverage-${pkg}`]: {
      name: `Upload coverage ${pkg}`,
      "runs-on": "ubuntu-latest",
      needs: [`test-${pkg}`],
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v2",
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
    [`check-version-${pkg}`]: {
      name: `Check version ${pkg}`,
      "runs-on": "ubuntu-latest",
      if: "${{ github.event_name == 'push' && github.ref == 'refs/heads/master' }}",
      outputs: {
        "should-publish": "${{ steps.check.outputs.changed }}",
      },
      steps: [
        {
          name: "Checkout",
          uses: "actions/checkout@v2",
        },
        {
          name: "Check for version changes",
          id: "check",
          uses: "EndBug/version-check@v2",
        },
        {
          name: "Set job status",
          if: "${{ steps.check.outputs.changed == 'false' }}",
          run: `echo "::set-output name=status::skip"`,
        },
      ],
    },
    [`publish-${pkg}`]: {
      name: `Publish ${pkg}`,
      "runs-on": "ubuntu-latest",
      needs: [`build-${pkg}`, `check-version-${pkg}`],
      if: `\${{ needs.check-version-${pkg}.outputs.should-publish == 'true' }}`,
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
          name: "Move dist/ to /",
          "working-directory": `./packages/${pkg}`,
          run: [`mv ./dist/* ./`, `rm -rf ./dist`],
        },
        {
          name: "Install Node.js",
          uses: "actions/setup-node@v3",
          with: {
            "node-version": "${{ env.PRIMARY_NODE_VERSION }}",
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
  yaml.stringify(workflow),
);

import { RuleTester } from "eslint";
import rule from "../src/rules/enforce-import-name";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2024,
    sourceType: "module",
  },
});

ruleTester.run("inker/enforce-import-name", rule, {
  valid: [
    {
      code: `import { something } from "some-module";
const { somethingElse } = require("another-module");
`,
      options: [
        {
          paths: [
            {
              name: "some-module",
              importNames: [
                {
                  imported: "something",
                  local: "something",
                },
              ],
            },
            {
              pattern: "another-module",
              importNames: [
                {
                  imported: "*",
                  local: "somethingElse",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      code: `import * as utils from "utils";
const { helper } = require("helper");
`,
      options: [
        {
          paths: [
            {
              pattern: "utils",
              importNames: [
                {
                  imported: "*",
                  local: "utils",
                },
              ],
            },
            {
              name: "helper",
              importNames: [
                {
                  imported: "helper",
                  local: "helper",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  invalid: [
    {
      code: `import { something } from "some-module";
const { somethingElse } = require("another-module");`,
      options: [
        {
          paths: [
            {
              name: "some-module",
              importNames: [
                {
                  imported: "something",
                  local: "some",
                },
              ],
            },
            {
              pattern: "another-module",
              importNames: [
                {
                  imported: "somethingElse",
                  local: "somethingElse2",
                },
              ],
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Local name should be "some"',
          suggestions: [
            {
              desc: "Rename to 'some'",
              output: `import { something as some } from "some-module";
const { somethingElse } = require("another-module");`,
            },
          ],
        },
        {
          message: 'Local name should be "somethingElse2"',
        },
      ],
    },
    {
      code: `const { helper } = require("helper");`,
      options: [
        {
          paths: [
            {
              name: "helper",
              importNames: [
                {
                  imported: "helper",
                  local: "help",
                },
              ],
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Local name should be "help"',
        },
      ],
    },
    {
      code: `import bar from "foo";`,
      options: [
        {
          paths: [
            {
              name: "foo",
              importNames: [
                {
                  imported: "default",
                  local: "foo",
                },
              ],
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Local name should be "foo"',
          suggestions: [
            {
              desc: "Rename to 'foo'",
              output: `import foo from "foo";`,
            },
          ],
        },
      ],
    },
    {
      code: `import * as bar from "foo";
const qux = require("foo");`,
      options: [
        {
          paths: [
            {
              name: "foo",
              importNames: [
                {
                  imported: "namespace",
                  local: "foo",
                },
              ],
            },
          ],
        },
      ],
      errors: [
        {
          message: 'Local name should be "foo"',
          suggestions: [
            {
              desc: "Rename to 'foo'",
              output: `import * as foo from "foo";
const qux = require("foo");`,
            },
          ],
        },
        {
          message: 'Local name should be "foo"',
        },
      ],
    },
  ],
});

import { RuleTester } from "eslint";
import rule from "../src/rules/no-true-as-default";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2024,
  },
});

ruleTester.run("inker/no-true-as-default", rule, {
  valid: [
    {
      code: "function testFunc(x = 10) { }",
    },
    {
      code: "const func = (x = 10) => { }",
    },
    {
      code: "const { x = false } = obj;",
    },
    {
      code: "const { x = undefined } = obj;",
    },
    {
      code: "const { x } = obj;",
    },
  ],
  invalid: [
    {
      code: "function testFunc(x = true) { }",
      errors: [
        {
          message: "Do not use true as a default value",
          type: "Literal",
        },
      ],
    },
    {
      code: "const testFunc = (x = true) => { }",
      errors: [
        {
          message: "Do not use true as a default value",
          type: "Literal",
        },
      ],
    },
    {
      code: "const { x = true } = obj;",
      errors: [
        {
          message: "Do not use true as a default value",
          type: "Literal",
        },
      ],
    },
  ],
});

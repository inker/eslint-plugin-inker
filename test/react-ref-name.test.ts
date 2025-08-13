import { RuleTester } from "eslint";
import rule from "../src/rules/react-ref-name";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2024,
  },
});

ruleTester.run("inker/react-ref-name", rule, {
  valid: [
    {
      code: "const ref = createRef();",
    },
    {
      code: "const someRef = createRef();",
    },
    {
      code: "const ref = useRef();",
    },
    {
      code: "const someRef = useRef();",
    },
  ],
  invalid: [
    {
      code: "const someVariable = createRef();",
      errors: [
        {
          message: 'Variable name should be "ref" or end with "Ref".',
          suggestions: [
            {
              desc: "Rename variable to 'someVariableRef'",
              output: "const someVariableRef = createRef();",
            },
          ],
        },
      ],
    },
    {
      code: "const someVariable = useRef();",
      errors: [
        {
          message: 'Variable name should be "ref" or end with "Ref".',
          suggestions: [
            {
              desc: "Rename variable to 'someVariableRef'",
              output: "const someVariableRef = useRef();",
            },
          ],
        },
      ],
    },
  ],
});

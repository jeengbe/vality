import { TSESTree } from "@typescript-eslint/utils";
import {
  arrayRequiresAsConst,
  isWithinAsConstContext,
  isWithinRequiresAsConstContext,
  objectRequiresAsConst,
  parentIsTrigger
} from "./nodeutils";
import { createRule } from "./utils";

function createNodesCache() {
  return new WeakMap<TSESTree.Node, boolean>();
}

export default createRule<[], "asConst">({
  create: (ctx) => {
    const nodeCaches = {
      isWithinAsConstContext: createNodesCache(),
      isWithinRequiresAsConstContext: createNodesCache(),
      objectRequiresAsConst: createNodesCache(),
      arrayRequiresAsConst: createNodesCache()
    };

    return {
      ObjectExpression(node) {
        if (
          !isWithinAsConstContext(node, nodeCaches) &&
          !isWithinRequiresAsConstContext(node, nodeCaches) &&
          objectRequiresAsConst(node, nodeCaches)
        ) {
          ctx.report({
            node,
            messageId: "asConst",
            fix(fixer) {
              return fixer.insertTextAfter(node, " as const");
            },
          });
        }
      },
      ArrayExpression(node) {
        if (
          !isWithinAsConstContext(node, nodeCaches) &&
          !isWithinRequiresAsConstContext(node, nodeCaches) &&
          (arrayRequiresAsConst(node, nodeCaches) || parentIsTrigger(node))
        ) {
          ctx.report({
            node,
            messageId: "asConst",
            fix(fixer) {
              return fixer.insertTextAfter(node, " as const");
            },
          });
        }
      },
    };
  },
  name: "as-const",
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure that no 'as const' assertions are forgotten where they are necessary for correct type inference.",
      recommended: "error",
      requiresTypeChecking: true,
    },
    messages: {
      asConst: "Missing 'as const' assertion.",
    },
    fixable: "code",
    schema: [],
  },
  defaultOptions: [],
});

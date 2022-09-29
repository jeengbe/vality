import { TSESTree } from "@typescript-eslint/utils";

const NODES = TSESTree.AST_NODE_TYPES;

type NodeCaches = Record<
  | "isWithinAsConstContext"
  | "isWithinRequiresAsConstContext"
  | "objectRequiresAsConst"
  | "arrayRequiresAsConst",
  WeakMap<TSESTree.Node, boolean>
>;

/**
 * Whether the node is within an 'as const' context
 */
export function isWithinAsConstContext(
  node: TSESTree.Node,
  nodeCaches: NodeCaches
): boolean {
  /* istanbul ignore next */
  if (nodeCaches.isWithinAsConstContext.has(node))
    return nodeCaches.isWithinAsConstContext.get(node)!;

  const origNode = node;
  do {
    if (
      node.type === NODES.TSAsExpression &&
      node.typeAnnotation.type === NODES.TSTypeReference &&
      node.typeAnnotation.typeName.type === NODES.Identifier &&
      node.typeAnnotation.typeName.name === "const"
    ) {
      nodeCaches.isWithinAsConstContext.set(origNode, true);
      return true;
    }

    // Only traverse objects and arrays upwards
    if (
      node.type !== NODES.Property &&
      node.type !== NODES.ObjectExpression &&
      node.type !== NODES.ArrayExpression
    ) {
      nodeCaches.isWithinAsConstContext.set(origNode, false);
      return false;
    }

  } while (node = node.parent!);

  // We always have a non-object/property/array at the root
  /* istanbul ignore next */
  return false;
}

/**
 * Whether one of the node's parents requires 'as const'
 */
export function isWithinRequiresAsConstContext(
  node: TSESTree.Node,
  nodeCaches: NodeCaches
): boolean {
  /* istanbul ignore next */
  if (nodeCaches.isWithinRequiresAsConstContext.has(node))
    return nodeCaches.isWithinRequiresAsConstContext.get(node)!;

  const origNode = node;
  while (node = node.parent!) {
    // Only traverse objects and arrays upwards
    if (
      node.type !== NODES.Property &&
      node.type !== NODES.ObjectExpression &&
      node.type !== NODES.ArrayExpression
    ) {
      nodeCaches.isWithinRequiresAsConstContext.set(origNode, false);
      return false;
    }

    if (requiresAsConst(node, nodeCaches, undefined)) {
      nodeCaches.isWithinRequiresAsConstContext.set(origNode, true);
      return true;
    }

  }

  /* istanbul ignore next */
  return false;
}

/**
 * Whether the passed node is an identifier for the Vality object
 */
export function isVality(node: TSESTree.Node): boolean {
  return (
    node.type === NODES.Identifier &&
    (node.name === "v" || node.name === "vality")
  );
}

/**
 * Whether the passed node should be within an 'as const' context
 */
export function requiresAsConst(
  node: TSESTree.Node,
  nodeCaches: NodeCaches,
  parentHasTrigger = false,
): boolean {
  switch (node.type) {
    case NODES.ObjectExpression:
      return objectRequiresAsConst(node, nodeCaches, parentHasTrigger);
    case NODES.ArrayExpression:
      return parentHasTrigger || arrayRequiresAsConst(node, nodeCaches);
    case NODES.Literal:
      return parentHasTrigger;
    case NODES.Property:
      return requiresAsConst(node.value, nodeCaches, parentHasTrigger);
    default:
      return false;
  }
}

export function objectRequiresAsConst(
  node: TSESTree.ObjectExpression,
  nodeCaches: NodeCaches,
  parentHasTrigger = false,
): boolean {
  /* istanbul ignore next */
  if (nodeCaches.objectRequiresAsConst.has(node))
    return nodeCaches.objectRequiresAsConst.get(node)!;

  let hasTrigger = parentHasTrigger;

  if (!hasTrigger) {
    for (const prop of node.properties) {
      /* istanbul ignore next */
      if (prop.type === NODES.SpreadElement) continue;

      if (isTrigger(prop.value)) {
        hasTrigger = true;
        break;
      }
    }
    if (!hasTrigger) {
      nodeCaches.objectRequiresAsConst.set(node, false);
      return false;
    };
  }

  for (const prop of node.properties) {
    /* istanbul ignore next */
    if (prop.type === NODES.SpreadElement) continue;

    if (requiresAsConst(prop, nodeCaches, true)) {
      nodeCaches.objectRequiresAsConst.set(node, true);
      return true;
    };
  }

  nodeCaches.objectRequiresAsConst.set(node, false);
  return false;
}

export function arrayRequiresAsConst(
  node: TSESTree.ArrayExpression,
  nodeCaches: NodeCaches,
): boolean {
  /* istanbul ignore next */
  if (nodeCaches.arrayRequiresAsConst.has(node))
    return nodeCaches.arrayRequiresAsConst.get(node)!;

  for (const prop of node.elements) {
    /* istanbul ignore next */
    if (prop.type === NODES.SpreadElement) continue;

    if (isTrigger(prop)) {
      return true;
    }
  }

  return false;
}

export function parentIsTrigger(node: TSESTree.Node): boolean {
  // We'll make sure to only call this with nodes with a parent (i.e. never with the root node)
  return isTrigger(node.parent!);
}

/**
 * Whether the precence of this node indicates that the its containing node is a Vality short
 */
export function isTrigger(node: TSESTree.Node): boolean {
  switch (node.type) {
    case NODES.ObjectExpression: {
      for (const prop of node.properties) {
        /* istanbul ignore next */
        if (prop.type === NODES.SpreadElement) continue;

        if (isTrigger(prop.value)) return true;
      }
      return false;
    }
    case NODES.ArrayExpression: {
      for (const prop of node.elements) {
        /* istanbul ignore next */
        if (prop.type === NODES.SpreadElement) continue;

        if (isTrigger(prop)) return true;
      }
      return false;
    }
    case NODES.MemberExpression:
      // v.guard
      return isVality(node.object);
    case NODES.CallExpression:
      // v.valit() / v.guard()
      if (node.callee.type === NODES.MemberExpression) {
        return isVality(node.callee.object);
      }
      // v.valit()()
      if (
        node.callee.type === NODES.CallExpression &&
        node.callee.callee.type === NODES.MemberExpression
      ) {
        return isVality(node.callee.callee.object);
      }
    default:
      return false;
  }
}

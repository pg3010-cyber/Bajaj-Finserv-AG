// treeBuilder.js — core graph construction logic
// Handles deduplication, adjacency list building, component discovery, and tree assembly

/**
 * Separates duplicate edges from the valid edge set.
 * The first occurrence of each unique parent->child pair is kept;
 * subsequent repeats are collected (each unique pair recorded once).
 *
 * @param {Array<{parent: string, child: string, raw: string}>} validEdges
 * @returns {{ uniqueEdges: Array<{parent: string, child: string, raw: string}>, duplicateEdges: string[] }}
 */
function deduplicateEdges(validEdges) {
  var seen = new Map();
  var dupeTracker = new Map();
  var uniqueEdges = [];
  var duplicateEdges = [];

  for (var i = 0; i < validEdges.length; i++) {
    var edge = validEdges[i];
    var edgeKey = edge.parent + '->' + edge.child;

    if (seen.has(edgeKey)) {
      // only record the duplicate label once, even if repeated 10 times
      if (!dupeTracker.has(edgeKey)) {
        dupeTracker.set(edgeKey, true);
        duplicateEdges.push(edgeKey);
      }
    } else {
      seen.set(edgeKey, true);
      uniqueEdges.push(edge);
    }
  }

  return { uniqueEdges: uniqueEdges, duplicateEdges: duplicateEdges };
}

/**
 * Constructs a directed adjacency list from unique edges.
 * Enforces single-parent rule: if a child already has a parent from
 * an earlier edge, later edges pointing to the same child are silently dropped.
 *
 * @param {Array<{parent: string, child: string}>} uniqueEdges
 * @returns {{ adjacency: Map<string, string[]>, allNodes: Set<string>, parentOf: Map<string, string> }}
 */
function buildAdjacencyList(uniqueEdges) {
  var adjacency = new Map();
  var parentOf = new Map();
  var allNodes = new Set();

  for (var i = 0; i < uniqueEdges.length; i++) {
    var edge = uniqueEdges[i];

    // multi-parent guard: the first parent to claim a child wins
    if (parentOf.has(edge.child)) {
      continue;
    }

    parentOf.set(edge.child, edge.parent);
    allNodes.add(edge.parent);
    allNodes.add(edge.child);

    if (!adjacency.has(edge.parent)) {
      adjacency.set(edge.parent, []);
    }
    adjacency.get(edge.parent).push(edge.child);
  }

  return { adjacency: adjacency, allNodes: allNodes, parentOf: parentOf };
}

/**
 * Groups nodes into connected components using undirected BFS.
 * Two nodes belong to the same component if any chain of edges
 * (ignoring direction) connects them.
 *
 * @param {Map<string, string[]>} adjacency - Directed adjacency list
 * @param {Set<string>} allNodes - Every node participating in active edges
 * @returns {string[][]} Array of node-label arrays, one per component
 */
function findComponents(adjacency, allNodes) {
  // build undirected neighbor map from directed edges
  var undirected = new Map();
  for (var node of allNodes) {
    undirected.set(node, []);
  }
  for (var entry of adjacency) {
    var parent = entry[0];
    var children = entry[1];
    for (var j = 0; j < children.length; j++) {
      undirected.get(parent).push(children[j]);
      undirected.get(children[j]).push(parent);
    }
  }

  var visited = new Set();
  var components = [];

  for (var node of allNodes) {
    if (visited.has(node)) {
      continue;
    }

    // BFS to find all reachable nodes in this component
    var component = [];
    var queue = [node];
    visited.add(node);

    while (queue.length > 0) {
      var current = queue.shift();
      component.push(current);
      var neighbors = undirected.get(current) || [];

      for (var k = 0; k < neighbors.length; k++) {
        if (!visited.has(neighbors[k])) {
          visited.add(neighbors[k]);
          queue.push(neighbors[k]);
        }
      }
    }

    components.push(component);
  }

  return components;
}

/**
 * Identifies the root node of a connected component.
 * Root = a node that never appears as a child in any surviving edge.
 * If every node appears as somebody's child (pure cycle), the
 * lexicographically smallest node is chosen as the synthetic root.
 *
 * @param {string[]} component - Node labels in this component
 * @param {Map<string, string>} parentOf - Maps child -> its designated parent
 * @returns {string}
 */
function findRoot(component, parentOf) {
  var candidates = [];

  for (var i = 0; i < component.length; i++) {
    if (!parentOf.has(component[i])) {
      candidates.push(component[i]);
    }
  }

  if (candidates.length === 0) {
    // every node is someone's child → pure cycle
    var sorted = component.slice().sort();
    return sorted[0];
  }

  // shouldn't have multiple roots in a well-formed tree,
  // but if it happens, pick the lexicographically smallest
  candidates.sort();
  return candidates[0];
}

/**
 * Produces a nested object representation of the tree starting from root.
 * Uses iterative DFS with an explicit stack to avoid call-stack limits.
 * Children appear in the order they were added to the adjacency list.
 *
 * @param {string} root - Starting node
 * @param {Map<string, string[]>} adjacency - Directed adjacency list
 * @returns {object} Nested tree like { "A": { "B": {}, "C": {} } }
 */
function buildNestedTree(root, adjacency) {
  var tree = {};

  // stack holds pending work: each item knows its node and where to attach
  var workStack = [{ node: root, container: tree }];

  while (workStack.length > 0) {
    var work = workStack.pop();
    var childObj = {};
    work.container[work.node] = childObj;

    var kids = adjacency.get(work.node) || [];

    // push in reverse so that the first child is processed first (LIFO)
    for (var r = kids.length - 1; r >= 0; r--) {
      workStack.push({ node: kids[r], container: childObj });
    }
  }

  return tree;
}

module.exports = {
  deduplicateEdges: deduplicateEdges,
  buildAdjacencyList: buildAdjacencyList,
  findComponents: findComponents,
  findRoot: findRoot,
  buildNestedTree: buildNestedTree
};

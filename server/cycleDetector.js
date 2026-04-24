// cycleDetector.js — iterative DFS-based cycle detection for directed graphs
// Uses the classic three-color (white/gray/black) method without recursion

var WHITE = 0;
var GRAY = 1;
var BLACK = 2;

/**
 * Detects whether a directed cycle exists within a set of nodes
 * using iterative DFS with explicit stack frames. A back-edge to
 * a gray (in-progress) node indicates a cycle.
 *
 * @param {string[]} componentNodes - All node labels in this connected component
 * @param {Map<string, string[]>} adjacency - Directed adjacency list (parent -> children)
 * @returns {boolean} true if at least one cycle is found
 */
function detectCycle(componentNodes, adjacency) {
  var color = new Map();

  // paint every node white initially
  for (var n = 0; n < componentNodes.length; n++) {
    color.set(componentNodes[n], WHITE);
  }

  // attempt DFS from each unvisited node in the component
  for (var s = 0; s < componentNodes.length; s++) {
    var startNode = componentNodes[s];
    if (color.get(startNode) !== WHITE) {
      continue;
    }

    // each frame tracks which child index we're about to explore
    var stack = [{ node: startNode, childIdx: 0 }];
    color.set(startNode, GRAY);

    while (stack.length > 0) {
      var frame = stack[stack.length - 1];
      var neighbors = adjacency.get(frame.node) || [];

      if (frame.childIdx >= neighbors.length) {
        // done with all children — mark fully explored
        color.set(frame.node, BLACK);
        stack.pop();
        continue;
      }

      var nextChild = neighbors[frame.childIdx];
      frame.childIdx += 1;

      var childColor = color.get(nextChild);

      // back-edge to a gray node means we found a cycle
      if (childColor === GRAY) {
        return true;
      }

      // only recurse into unvisited nodes
      if (childColor === WHITE || childColor === undefined) {
        color.set(nextChild, GRAY);
        stack.push({ node: nextChild, childIdx: 0 });
      }
      // BLACK nodes are already fully explored, skip them
    }
  }

  return false;
}

/**
 * Computes the depth of a tree rooted at the given node using iterative DFS.
 * Depth = number of nodes on the longest root-to-leaf path.
 * Only call this on acyclic trees — behaviour on cyclic input is undefined.
 *
 * @param {string} root - Root node label
 * @param {Map<string, string[]>} adjacency - Directed adjacency list
 * @returns {number} Maximum depth of the tree
 */
function measureDepth(root, adjacency) {
  var deepest = 0;
  var stack = [{ node: root, level: 1 }];

  while (stack.length > 0) {
    var current = stack.pop();
    var children = adjacency.get(current.node) || [];

    if (children.length === 0) {
      // leaf node — check if this path is the longest so far
      if (current.level > deepest) {
        deepest = current.level;
      }
    } else {
      for (var c = 0; c < children.length; c++) {
        stack.push({ node: children[c], level: current.level + 1 });
      }
    }
  }

  // edge case: single node with no children
  if (deepest === 0) {
    deepest = 1;
  }

  return deepest;
}

module.exports = { detectCycle, measureDepth };

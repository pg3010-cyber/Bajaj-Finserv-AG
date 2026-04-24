// summarizer.js — aggregates hierarchy results into a summary block
// Counts trees vs cycles and identifies the deepest tree root

/**
 * Builds a summary object from the processed hierarchy array.
 * Counts non-cyclic trees, cyclic groups, and finds the root
 * of the tree with the greatest depth. Ties are broken by
 * lexicographic comparison (smaller root wins).
 *
 * @param {Array<{root: string, tree: object, depth?: number, has_cycle?: boolean}>} hierarchies
 * @returns {{ total_trees: number, total_cycles: number, largest_tree_root: string }}
 */
function buildSummary(hierarchies) {
  var treeCount = 0;
  var cycleCount = 0;
  var maxDepth = -1;
  var deepestRoot = '';

  for (var h = 0; h < hierarchies.length; h++) {
    var entry = hierarchies[h];

    if (entry.has_cycle === true) {
      cycleCount += 1;
    } else {
      treeCount += 1;
      var currentDepth = entry.depth || 0;

      // update deepest tree — if tied, pick lexicographically smaller root
      var shouldReplace = (currentDepth > maxDepth) ||
        (currentDepth === maxDepth && entry.root < deepestRoot);

      if (shouldReplace) {
        maxDepth = currentDepth;
        deepestRoot = entry.root;
      }
    }
  }

  return {
    total_trees: treeCount,
    total_cycles: cycleCount,
    largest_tree_root: deepestRoot
  };
}

module.exports = { buildSummary };

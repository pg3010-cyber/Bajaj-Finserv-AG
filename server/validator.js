// validator.js — handles raw input sanitization and format checks
// Each entry must be exactly one uppercase letter, arrow separator, one uppercase letter

var NODE_EDGE_PATTERN = /^([A-Z])->([A-Z])$/;

/**
 * Validates an array of raw node-string entries against the required format.
 * Trims whitespace from each entry before checking. Rejects self-loops,
 * multi-character nodes, wrong separators, missing halves, and non-letter entries.
 *
 * @param {string[]} entries - Raw input strings from the request body
 * @returns {{ validEdges: Array<{parent: string, child: string, raw: string}>, invalidEntries: string[] }}
 */
function validateEntries(entries) {
  var validEdges = [];
  var invalidEntries = [];

  for (var idx = 0; idx < entries.length; idx++) {
    var original = entries[idx];

    // coerce non-strings gracefully, though spec expects strings
    var trimmed = (typeof original === 'string') ? original.trim() : String(original).trim();
    var match = trimmed.match(NODE_EDGE_PATTERN);

    // self-loops (like A->A) are explicitly invalid per spec
    if (match !== null && match[1] !== match[2]) {
      validEdges.push({
        parent: match[1],
        child: match[2],
        raw: trimmed
      });
    } else {
      // push original entry so the caller sees what was actually submitted
      invalidEntries.push(original);
    }
  }

  return { validEdges: validEdges, invalidEntries: invalidEntries };
}

module.exports = { validateEntries };

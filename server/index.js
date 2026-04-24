// index.js — Express server entry point
// Wires up middleware and the POST /bfhl route, delegating all logic to modules

var express = require('express');
var cors = require('cors');

var validator = require('./validator');
var treeBuilder = require('./treeBuilder');
var cycleDetector = require('./cycleDetector');
var summarizer = require('./summarizer');

// ── identity constants (update these with your real details) ──
var USER_ID = 'pari_gupta_01012004';
var EMAIL_ID = 'pg5765@srmist.edu.in';
var COLLEGE_ROLL = 'RA2111003010765';

var PORT = process.env.PORT || 3000;

var app = express();

app.use(cors());
app.use(express.json());

// health-check so we know the service is alive
app.get('/', function (req, res) {
  res.json({ status: 'ok', endpoint: 'POST /bfhl' });
});

/**
 * POST /bfhl — main hierarchy processing endpoint.
 * Accepts { data: string[] }, validates, builds trees,
 * detects cycles, and returns structured analysis.
 */
app.post('/bfhl', function (req, res) {
  var body = req.body || {};

  // ── input guards ──
  if (!Object.prototype.hasOwnProperty.call(body, 'data')) {
    return res.status(400).json({ error: 'missing data field' });
  }
  if (!Array.isArray(body.data)) {
    return res.status(400).json({ error: 'data must be an array' });
  }

  // step 1: validate raw entries
  var validation = validator.validateEntries(body.data);

  // step 2: remove duplicate edges
  var dedup = treeBuilder.deduplicateEdges(validation.validEdges);

  // step 3: build directed adjacency list (multi-parent silently handled)
  var graph = treeBuilder.buildAdjacencyList(dedup.uniqueEdges);

  // step 4: discover independent connected components
  var components = treeBuilder.findComponents(graph.adjacency, graph.allNodes);

  // step 5: process each component into a hierarchy object
  var hierarchies = [];

  for (var ci = 0; ci < components.length; ci++) {
    var compNodes = components[ci];
    var root = treeBuilder.findRoot(compNodes, graph.parentOf);

    var hasCycle = cycleDetector.detectCycle(compNodes, graph.adjacency);

    if (hasCycle) {
      hierarchies.push({
        root: root,
        tree: {},
        has_cycle: true
      });
    } else {
      var nestedTree = treeBuilder.buildNestedTree(root, graph.adjacency);
      var depth = cycleDetector.measureDepth(root, graph.adjacency);

      hierarchies.push({
        root: root,
        tree: nestedTree,
        depth: depth
      });
    }
  }

  // step 6: aggregate summary stats
  var summary = summarizer.buildSummary(hierarchies);

  // assemble final response
  var response = {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL,
    hierarchies: hierarchies,
    invalid_entries: validation.invalidEntries,
    duplicate_edges: dedup.duplicateEdges,
    summary: summary
  };

  return res.json(response);
});

app.listen(PORT, function () {
  console.log('BFHL API listening on port ' + PORT);
});

module.exports = app;

#!/usr/bin/env node
'use strict';
var conventionalChangelog = require('./');
var fs = require('fs');
var meow = require('meow');

var cli = meow({
  help: [
    'Usage',
    '  conventional-changelog [<path>]',
    '  cat <path> | conventional-changelog',
    '',
    'Example',
    '  conventional-changelog CHANGELOG.md > CHANGELOG.md',
    '  cat CHANGELOG.md | conventional-changelog',
    '',
    'Options',
    '  -o, --options          A filepath of a javascript that is used to define options',
    '  -t, --context          A filepath of a javascript that is used to define template variables',
    '  --gitRawCommitsOpts    A filepath of a javascript that is used to define git-raw-commits options',
    '  --parserOpts           A filepath of a javascript that is used to define conventional-commits-parser options',
    '  --writerOpts           A filepath of a javascript that is used to define conventional-commits-writer options',
  ].join('\n')
}, {
  alias: {
    o: 'options',
    c: 'context'
  }
});

var path = cli.input[0];
var flags = cli.flags;
var options;
var templateContext;
var gitRawCommitsOpts;
var parserOpts;
var writerOpts;

try {
  if (flags.options) {
    options = require(flags.options);
  }

  if (flags.context) {
    templateContext = require(flags.context);
  }

  if (flags.gitRawCommitsOpts) {
    gitRawCommitsOpts = require(flags.gitRawCommitsOpts);
  }

  if (flags.parserOpts) {
    parserOpts = require(flags.parserOpts);
  }

  if (flags.writerOpts) {
    writerOpts = require(flags.writerOpts);
  }
} catch (err) {
  console.error('Failed to get file. ' + err);
  process.exit(1);
}

var stream = conventionalChangelog(options, templateContext, gitRawCommitsOpts, parserOpts, writerOpts);

if (path && (!options || !options.allBlocks)) {
  if (options && options.append) {
    fs.createReadStream(path)
      .on('end', function() {
        stream
          .pipe(process.stdout);
      })
      .pipe(process.stdout);
  } else {
    stream
      .on('end', function() {
        fs.createReadStream(path)
          .pipe(process.stdout);
      })
      .pipe(process.stdout);
  }
} else {
  stream
    .pipe(process.stdout);
}

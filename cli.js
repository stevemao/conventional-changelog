#!/usr/bin/env node
'use strict';
var addStream = require('add-stream');
var conventionalChangelog = require('./');
var fs = require('fs');
var meow = require('meow');
var tempfile = require('tempfile');
var _ = require('lodash');

var cli = meow({
  help: [
    'Usage',
    '  conventional-changelog',
    '',
    'Example',
    '  conventional-changelog -i CHANGELOG.md --overwrite',
    '',
    'Options',
    '  -i, --infile              Read the CHANGELOG from this file.',
    '  -o, --outfile             Write the CHANGELOG to this file. If unspecified, it prints to stdout',
    '  -w, --overwrite           Overwrite the infile',
    '  -p, --preset              Name of the preset you want to use',
    '  -k, --pkg                 A filepath of where your package.json is located',
    '  -a, --append              Should the generated block be appended',
    '  -b, --all-blocks          Generate all blocks',
    '  -v, --verbose             Verbose output',
    '  -c, --context             A filepath of a javascript that is used to define template variables',
    '  --git-raw-commits-opts    A filepath of a javascript that is used to define git-raw-commits options',
    '  --parser-opts             A filepath of a javascript that is used to define conventional-commits-parser options',
    '  --writer-opts             A filepath of a javascript that is used to define conventional-commits-writer options'
  ].join('\n')
}, {
  alias: {
    i: 'infile',
    o: 'outfile',
    w: 'overwrite',
    p: 'preset',
    k: 'pkg',
    a: 'append',
    b: 'allBlocks',
    v: 'verbose',
    c: 'context'
  }
});

var flags = cli.flags;
var infile = flags.infile;
var outfile = flags.outfile;
var overwrite = flags.overwrite;
var append = flags.append;
var allBlocks = flags.allBlocks;

if (infile && infile === outfile) {
  overwrite = true;
} else if (overwrite) {
  if (infile) {
    outfile = infile;
  } else {
    console.error('Nothing to overwrite');
    process.exit(1);
  }
}

var options = _.omit({
  preset: flags.preset,
  pkg: flags.pkg,
  append: append,
  allBlocks: allBlocks
}, _.isUndefined);

if (flags.verbose) {
  options.warn = console.warn.bind(console);
}

var templateContext;
var gitRawCommitsOpts;
var parserOpts;
var writerOpts;

try {
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

var changelogStream = conventionalChangelog(options, templateContext, gitRawCommitsOpts, parserOpts, writerOpts);

if (infile && !allBlocks) {
  if (overwrite) {
    if (options.append) {
      changelogStream
        .pipe(fs.createWriteStream(outfile, {
          flags: 'a'
        }));
    } else {
      var tmp = tempfile();

      changelogStream
        .pipe(addStream(fs.createReadStream(infile)))
        .pipe(fs.createWriteStream(tmp))
        .on('finish', function() {
          fs.createReadStream(tmp)
            .pipe(fs.createWriteStream(infile));
        });
    }
  } else {
    var outStream;

    if (outfile) {
      outStream = fs.createWriteStream(outfile);
    } else {
      outStream = process.stdout;
    }

    var stream;

    if (options.append) {
      stream = fs.createReadStream(infile)
        .pipe(addStream(changelogStream));
    } else {
      stream = changelogStream
        .pipe(addStream(fs.createReadStream(infile)));
    }

    stream
      .pipe(outStream);
  }
} else {
  if (outfile) {
    outStream = fs.createWriteStream(outfile);
  } else {
    outStream = process.stdout;
  }

  changelogStream
    .pipe(outStream);
}

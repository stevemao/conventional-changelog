var shell = require('shelljs');

shell.config.silent = true;
shell.rm('-rf', 'tmp');
shell.mkdir('tmp');
shell.cd('tmp');

shell.mkdir('test');
shell.mkdir('angular');
shell.mkdir('jquery');
shell.mkdir('cli');

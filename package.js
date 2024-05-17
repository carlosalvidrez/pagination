Package.describe({
  name: 'balines:pagination',
  version: '0.0.1',
  summary: 'Meteor 3.0 pagination, forked from kurounin:pagination',
  git: 'https://github.com/carlosalvidrez/pagination.git',
  documentation: 'README.md'
});

Package.onUse((api) => {
    api.versionsFrom('2.16');
    api.use([
        'ecmascript',
        'meteor-base',
        'check',
        'underscore',
        'mongo',
    ]);
    api.mainModule('server/pagination.js', 'server');
    api.use([
        'tracker',
        'reactive-var',
        'reactive-dict',
    ], 'client');
    api.mainModule('client/pagination.js', 'client');
});


// Package.onTest(function(api) {
//   api.use('ecmascript');
//   api.use('tinytest');
//   api.use('balines:pagination');
//   api.mainModule('pagination-tests.js');
// });

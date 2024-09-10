Package.describe({
  name: 'carlosalvidrez:pagination',
  version: '0.0.2',
  summary: 'Meteor 3.0 pagination, forked from kurounin:pagination',
  git: 'https://github.com/carlosalvidrez/pagination.git',
  documentation: 'README.md'
});

Package.onUse((api) => {
    api.versionsFrom('2.16');
    api.use([
        'ecmascript',
        'check',
        'underscore',
    ]);
    api.mainModule('server/pagination.js', 'server');
    api.use([
        'tracker',
        'reactive-var',
        'reactive-dict',
    ], 'client');
    api.mainModule('client/pagination.js', 'client');
});

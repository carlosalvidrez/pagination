// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by pagination.js.
import { name as packageName } from "meteor/balines:pagination";

// Write your tests here!
// Here is an example.
Tinytest.add('pagination - example', function (test) {
  test.equal(packageName, "pagination");
});

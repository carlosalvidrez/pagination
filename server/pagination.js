import { _ } from "meteor/underscore";
import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";

const countCollectionName = "pagination-counts";

export async function publishPagination(collection, settingsIn) {
  const settings = _.extend(
    {
      name: collection._name,
      filters: {},
      dynamic_filters() {
        return {};
      },
      countInterval: 10000,
    },
    settingsIn || {},
  );

  if (typeof settings.filters !== "object")
    throw new Meteor.Error(
      4001,
      "Invalid filters: server side filters must be an object.",
    );

  if (typeof settings.dynamic_filters !== "function")
    throw new Meteor.Error(
      4002,
      "Invalid dynamic filters: server side dynamic filters must be a function.",
    );

  if (settings.countInterval < 50) settings.countInterval = 50;

  await Meteor.publish(
    settings.name,
    async function addPub(query = {}, optionsInput = {}) {
      this.unblock();
      check(query, Match.Optional(Object));
      check(optionsInput, Match.Optional(Object));
      const self = this;
      let options = optionsInput;
      let findQuery = {};
      let filters = [];

      if (!_.isEmpty(query)) filters.push(query);
      if (!_.isEmpty(settings.filters)) filters.push(settings.filters);
      const dynamic_filters = await settings.dynamic_filters.call(self);
      if (typeof dynamic_filters === "object") {
        if (!_.isEmpty(dynamic_filters)) filters.push(dynamic_filters);
      } else
        throw new Meteor.Error(
          4002,
          "Invalid dynamic filters return type. Server side dynamic filters needs to be a function that returns an object!",
        );

      if (typeof settings.transform_filters === "function")
        filters = await settings.transform_filters.call(self, filters, options);

      if (typeof settings.transform_options === "function")
        options = await settings.transform_options.call(self, filters, options);

      if (filters.length > 0) {
        if (filters.length > 1) findQuery.$and = filters;
        else findQuery = filters[0];
      }

      if (options.debug)
        console.log(
          "Pagination",
          settings.name,
          options.reactive
            ? `reactive (counting every ${settings.countInterval}ms)`
            : "non-reactive",
          "publish",
          JSON.stringify(findQuery),
          JSON.stringify(options),
        );

      if (!options.reactive) {
        const subscriptionId = `sub_${self._subscriptionId}`;
        const count = await collection
          .find(findQuery, { fields: { _id: 1 } })
          .countAsync();
        const docs = collection.find(findQuery, options).fetch();
        self.added(countCollectionName, subscriptionId, { count: count });
        _.each(docs, function (doc) {
          self.added(collection._name, doc._id, doc);
          self.changed(collection._name, doc._id, { [subscriptionId]: 1 });
        });
      } else {
        const subscriptionId = `sub_${self._subscriptionId}`;
        const countCursor = collection.find(findQuery, { fields: { _id: 1 } });
        self.added(countCollectionName, subscriptionId, {
          count: await countCursor.countAsync(),
        });
        const updateCount = _.throttle(
          Meteor.bindEnvironment(async () => {
            self.changed(countCollectionName, subscriptionId, {
              count: await countCursor.countAsync(),
            });
          }),
          50,
        );
        const countTimer = Meteor.setInterval(function () {
          updateCount();
        }, settings.countInterval);

        const handle = await collection
          .find(findQuery, options)
          .observeChanges({
            added(id, fields) {
              self.added(collection._name, id, fields);
              self.changed(collection._name, id, { [subscriptionId]: 1 });
              updateCount();
            },
            changed(id, fields) {
              self.changed(collection._name, id, fields);
            },
            removed(id) {
              self.removed(collection._name, id);
              updateCount();
            },
          });

        self.onStop(async () => {
          await Meteor.clearTimeout(countTimer);
          if (handle && typeof handle.stop === "function") await handle.stop();
          else
            console.error(
              "handle is not defined or does not have a stop method",
            );
        });
      }
      self.ready();
    },
  );
}

class PaginationFactory {
  constructor(collection, settingsIn) {
    console.warn(
      "Deprecated use of Meteor.Pagination. On server-side use publishPagination() function.",
    );
    publishPagination(collection, settingsIn);
  }
}

Meteor.Pagination = PaginationFactory;

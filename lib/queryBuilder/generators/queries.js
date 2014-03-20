/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Query Genenerators
 * This module contains generator functions for ElasticSearch Query DSL objects.
 * When creating base query objects for various types of Elastic Search queries,
 * add the generator functions here
 */

module.exports = {
  /*
   * The baseQuery return object should be used when there aren't
   * any additional filters to be applied to a query. For example,
   * a search for the 20 most recently created makes can be made using this query.
   * This is a filtered query: http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-filtered-query.html
   */
  baseQuery: function() {
    return {
      query: {
        filtered: {
          query: {
            match_all: {}
          },
          filter: {
            bool: {
              must: [
                {
                  missing: {
                    field: "deletedAt",
                    null_value: true
                  }
                },
                {
                  term: {
                    published: true
                  }
                }
              ],
              should: []
            }
          }
        }
      }
    };
  },

  /*
   * Use the advanced query when you need to generate more complex queries
   * that will need filters applied for different make fields.
   * The advancedQuery inherits the baseQuery as it's query for a
   * filtered query: http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-filtered-query.html
   */
  advancedQuery: function() {
    return {
      query: {
        filtered: {
          filter: {
            bool: {
              must: [],
              should: []
            }
          },
          query: this.baseQuery().query
        }
      }
    };
  },

  authenticatedBaseQuery: function() {
    var authenticatedQuery = this.baseQuery();
    authenticatedQuery.query.filtered.filter.bool.must.splice( 1, 1 );
    return authenticatedQuery;
  },

  authenticatedAdvancedQuery: function() {
    var authenticatedQuery = this.advancedQuery();
    authenticatedQuery.query.filtered.query.filtered.filter.bool.must.splice( 1, 1 );
    return authenticatedQuery;
  },

  baseBoostQuery: function() {
    return {
      query: {
        function_score: {
          functions: [],
          score_mode: "sum",
          query: this.baseQuery().query
        }
      }
    };
  },

  advancedBoostQuery: function() {
    return {
      query: {
        function_score: {
          functions: [],
          score_mode: "sum",
          query: this.advancedQuery().query
        }
      }
    };
  },

  authenticatedBaseBoostQuery: function() {
    var query = this.baseBoostQuery();
    query.query.function_score.query.filtered.filter.bool.must.splice( 1, 1 );
    return query;
  },

  authenticatedAdvancedBoostQuery: function() {
    var query = this.advancedBoostQuery();
    query.query.function_score.query.filtered.query.filtered.filter.bool.must.splice( 1, 1 );
    return query;
  }
};

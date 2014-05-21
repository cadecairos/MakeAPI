/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Search Query Generator
 * This module will generate Elasticsearch query DSL
 */

var async = require( "async" );

var generators = require( "../generators" ),
    utils = require( "../utils" );

module.exports = function( query, callback, isAuthenticated ) {
  var dsl;

  if ( query.filters && Array.isArray( query.filters ) ) {
    query.filters.forEach(function( filter ) {
      if ( utils.isValidFilter( filter ) ) {

      }
    });
  }

  dsl.size = utils.validateSize( query.limit );
  dsl.from = utils.validatePage( query.page, dsl.size );

};

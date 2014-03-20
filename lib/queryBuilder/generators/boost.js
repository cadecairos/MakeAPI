/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Boosting filter generators
 * This module generates filters for use with a custom_filters_score query
*/
var generic = require( "./generic" );

var DEFAULT_BOOST_VAL = 2.0;

var SCRIPT_BOOST = "_score * (doc['{{field}}._id'].values.length + 1)";

var SCRIPT_BOOST_FIELDS = [ "likes", "reports" ];

module.exports.filter = function( filterSettings, negateFilter ) {
  var filterMap = {},
      filter = {};

  if ( filterSettings.type !== "match_all" ) {
    filterMap[ filterSettings.field ] = filterSettings.value;
    negateFilter = !!negateFilter;
  } else {
    negateFilter = false;
  }

  filter.filter = generic.generateSearchFilter( filterSettings.type, filterMap, negateFilter );

  if ( SCRIPT_BOOST_FIELDS.indexOf( filterSettings.boost ) !== -1 ) {
    filter.script_score = {
      lang: "js",
      script: SCRIPT_BOOST.replace( "{{field}}", filterSettings.boost )
    };
  } else {
    filterSettings.boost = parseInt( filterSettings.boost, 10 );
    filter.boost_factor = isFinite( filterSettings.boost ) ? filterSettings.boost : DEFAULT_BOOST_VAL;
  }

  return filter;
};

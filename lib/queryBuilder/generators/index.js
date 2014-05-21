/* This Source Code Form is subject to the terms of the Mozilla Publicfunction generateTermsFilter( terms, field, not ) {
  var execution,
    filterObj = {};

  // terms will be a comma delimited list of terms provided in the request
  terms = terms.map(function( term ) {
    return term.trim();
  });

  // The first element will always indicate the type of execution
  // for ES to run the terms filter with.
  // For example, "the make should have terms a AND b" or
  // "the make should have term a OR term b"
  if ( terms[ 0 ] === "and" || terms[ 0 ] === "or" ) {
    execution = terms.splice( 0, 1 )[ 0 ];
  }

  filterObj[ field ] = terms;

  if ( execution ) {
    filterObj.execution = execution;
  }

  return generateSearchFilter( "terms", filterObj, not );
}
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = {
  facets: require( "./facets" ),
  generic: require( "./generic" ),
  likedByUser: require( "./likedByUser" ),
  queries: require( "./queries" ),
  remix: require( "./remix" ),
  search: require( "./search" ),
  sort: require( "./sort" ),
  user: require( "./user" )
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var DEFAULT_SEARCH_SIZE = 10,
    MAX_SEARCH_SIZE = 1000;

var SEARCH_KEYS = require( "generators/search" ).KEYS;

var FIELD_FILTER_MAP = {
  tagPrefix:   [ "prefix" ],
  id:          [ "query" ],
  title:       [ "query" ],
  description: [ "query" ],
  author:      [ "term" ],
  user:        [ "term" ],
  url:         [ "term" ],
  contentType: [ "term" ],
  remixedFrom: [ "term" ],
  tags:        [ "terms" ]
};

 // if a field is to be negated (i.e. makes not containing the title "yolo"),
// the field will be prefixed with the following string (no quotes): "{!}"
module.exports.NOT_REGEX = /^\{!\}(.+)$/;

// detect if there is a matching search generator for a given field
module.exports.hasValidField = function( field ) {
  return SEARCH_KEYS.indexOf( field ) !== -1;
};

module.exports.isValidFilter = function ( filter ) {
  if ( !filter.field || !filter.type || !filter.query ) {
    return false;
  }
  if ( !FIELD_FILTER_MAP[ filter.field ] || FIELD_FILTER_MAP[filter.field].indexOf( filter.type ) === -1 ) {
    return false;
  }
  return true;
};

// Validate a given size & checks if the value is in
// the correct bounds: >= 1 <= MAX_SEARCH_SIZE
module.exports.validateSize = function( size ) {
  size = size && isFinite( size ) ? size : DEFAULT_SEARCH_SIZE;
  if ( size > MAX_SEARCH_SIZE ) {
    return MAX_SEARCH_SIZE;
  } else if ( size < 1 ) {
    return 1;
  }
  return size;
};

// Validate that the requested page is a number and is
// within correct bounds: page >= 0. Will also calculate
// the correct "from" value based on requested number of results
// see: http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-request-from-size.html
module.exports.validatePage = function( page, size ) {
  page = page && isFinite( page ) ? page : 1;
  if ( page < 1 ) {
    return 0;
  }
  return --page * size;
};


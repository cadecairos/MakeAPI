/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Search Query Generator
 * This module will generate Elasticsearch query DSL that can
 * be used to search for makes.
 * For documentation, see: https://github.com/mozilla/makeapi-client/blob/master/README.md
 */

var DEFAULT_SEARCH_SIZE = 10,
    MAX_SEARCH_SIZE = 1000;

var generators = require( "../generators" );

// if a field is to be negated (i.e. makes not containing the title "yolo"),
// the field will be prefixed with the following string (no quotes): "{!}"
var NOT_REGEX =  /^(\{!\})?(.+)$/;

// detect if there is a matching search generator for a given field
function matchValidField( field ) {
  return generators.search.KEYS.indexOf( field ) !== -1;
}

// Validate a given size & checks if the value is in
// the correct bounds: >= 1 <= MAX_SEARCH_SIZE
function validateSize( size ) {
  size = size && isFinite( size ) ? size : DEFAULT_SEARCH_SIZE;
  if ( size > MAX_SEARCH_SIZE ) {
    return MAX_SEARCH_SIZE;
  } else if ( size < 1 ) {
    return 1;
  }
  return size;
}

// Validate that the requested page is a number and is
// within correct bounds: page >= 0. Will also calculate
// the correct "from" value based on requested number of results
// see: http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-request-from-size.html
function validatePage( page, size ) {
  page = page && isFinite( page ) ? page : 1;
  if ( page < 1 ) {
    return 0;
  }
  return --page * size;
}

function generateFilters( query, queryKeys ) {
  var filters = [],
      notRegexMatch;
  queryKeys.forEach(function( key ) {
    var value = query[ key ];
    if ( generators.search.KEYS.indexOf( key ) !== -1 ) {
      notRegexMatch = NOT_REGEX.exec( value );
      filters.push( generators.search.filters[ key ]( notRegexMatch[ 2 ], !!notRegexMatch[ 1 ] ) );
    }
  });
  return filters;
}

function generateBoostFilters( filterTypes, filterFields, filterValues, filterBoosts ) {
  var filters = [],
      notRegexMatch,
      field,
      val,
      boost;

  filterTypes.forEach(function( type, idx ) {
    field = filterFields[ idx ];
    val = filterValues[ idx ];
    boost = filterBoosts[ idx ];

    if ( !field || !val ) {
      return;
    }
    notRegexMatch = NOT_REGEX.exec( type );
    filters.push(generators.boost.filter({
      type: notRegexMatch[ 2 ],
      field: field,
      value: val,
      boost: boost
    }, !!notRegexMatch[ 1 ] ));
  });
  return filters;
}

function generateComplexQuery( queryFilters, filterOccurence, authenticated ) {
  var searchQuery;
  if ( authenticated ) {
    searchQuery = generators.queries.authenticatedAdvancedQuery();
  } else {
    searchQuery = generators.queries.advancedQuery();
  }
  searchQuery.query.filtered.filter.bool[ filterOccurence ] = queryFilters;
  return searchQuery;
}

function generateBaseQuery( authenticated ) {
  if ( authenticated ) {
    return generators.queries.authenticatedBaseQuery();
  }
  return generators.queries.baseQuery();
}

function generateComplexBoostQuery( queryFilters, boostFilters, filterOccurence, auth ) {
  var searchQuery;
  if ( auth ) {
    searchQuery = generators.queries.authenticatedAdvancedBoostQuery();
  } else {
    searchQuery = generators.queries.advancedBoostQuery();
  }
  searchQuery.query.function_score.query.filtered.filter.bool[ filterOccurence ] = queryFilters;
  searchQuery.query.function_score.functions = boostFilters;
  return searchQuery;
}

function generateBoostQuery( boostFilters, auth ) {
  var searchQuery;
  if ( auth ) {
    searchQuery = generators.queries.authenticatedBaseBoostQuery();
  } else {
    searchQuery = generators.queries.authenticatedBaseBoostQuery();
  }
  searchQuery.query.function_score.functions = boostFilters;
  return searchQuery;
}

// DSL generator function - accepts an object that defines a query
// and a callback to pass the generated DSL to
module.exports = function( query, callback, authenticated ) {
  if ( !( query && query.constructor === Object ) || !( callback && typeof callback === "function" ) ) {
    throw new Error( "Check your arguments." );
  }

  query.limit = +query.limit;
  query.page = +query.page;
  var size = query.limit,
      page = query.page,
      user = query.user,
      sort = query.sortByField,
      boost = query.boostFilterTypes && query.boostFilterFields && query.boostFilterValues,
      filterOccurence = query.or ? "should" : "must",
      queryKeys = Object.keys( query ),
      isComplexQuery = queryKeys.some( matchValidField ),
      boostFilters,
      searchQuery,
      sortObj;

  if ( boost ) {
    query.boostScoringValues = query.boostScoringValues ? query.boostScoringValues : "";
    boostFilters = generateBoostFilters(
      query.boostFilterTypes.split( "," ),
      query.boostFilterFields.split( "," ),
      query.boostFilterValues.split( "," ),
      query.boostScoringValues.split( "," )
    );
    if ( isComplexQuery ) {
      searchQuery = generateComplexBoostQuery( generateFilters( query, queryKeys), boostFilters, filterOccurence, authenticated );
    } else {
      searchQuery = generateBaseBoostQuery( boostFilters, authenticated );
    }
  } else if ( isComplexQuery ) {
    searchQuery = generateComplexQuery( generateFilters( query, queryKeys ), filterOccurence, authenticated );
  } else {
    searchQuery = generateBaseQuery( authenticated );
  }

  searchQuery.size = validateSize( size );
  searchQuery.from = validatePage( page, searchQuery.size );

  if ( sort ) {
    sort = ( Array.isArray( sort ) ? sort : [ sort ] ).filter(function( pair ) {
      return typeof pair === "string" &&
        pair.length &&
        generators.sort.VALID_SORT_FIELDS.indexOf( pair.split( "," )[ 0 ] ) !== -1;
    });
    if ( sort.length ) {
      searchQuery.sort = [];
      sort.forEach(function( pair ) {
        pair = pair.split( "," );
        var type = pair[ 0 ],
            order = pair[ 1 ];
        if ( generators.sort.SCRIPT_SORT_TYPES.indexOf( type ) !== -1 ) {
          sortObj = generators.sort.generateScriptSort( type, order );
        } else {
          sortObj = generators.sort.generateRegularSort( type, order );
        }
        searchQuery.sort.push( sortObj );
      });
    }
  }

  // Due to makes being assigned emails and not usernames,
  // this must be a special separate case...
  if ( user ) {
    notRegexMatch = NOT_REGEX.exec( user );
    if ( notRegexMatch ) {
      user = notRegexMatch[ 1 ];
    }
    generators.user({
      user: user,
      isOr: !!searchQuery.query.filtered.filter.bool.should.length,
      not: !!notRegexMatch
    }, function generationComplete( err, filter ) {
      if ( err ) {
        return callback( err );
      }

      // add the returned user filter if it exists
      // it may not exist and not be erroneous if
      // the filters are running with the "or"
      // execution style.
      if ( filter ) {
        searchQuery.query.filtered.filter.bool[ filterOccurence ].push( filter );
      }

      // pass the generated DSL to the callback
      return callback( null, searchQuery );
    });
  } else {
    // pass the generated DSL to the callback
    return callback( null, searchQuery );
  }
};

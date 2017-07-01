{
	function isFunction(functionToCheck) {
		var getType = {};
		return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
	}
	
	function sortArgs(args) {
		return Array.prototype.slice.call(args);
	}
	
	function computeTextUnit(arrgs) {
	
		if (typeof arrgs === 'undefined') return '';
		else if (Array.isArray(arrgs)) return arrgs.map(function(arg)  { return computeTextUnit(arg);}).join('');
		else if (arrgs !== null && typeof arrgs === 'object' && arrgs.hasOwnProperty('txt') && isFunction(arrgs.txt)) return arrgs.txt();
		else if (arrgs !== null && typeof arrgs === 'object' && (!arrgs.hasOwnProperty('txt') || isFunction(arrgs.txt))) return '';
		else if (arrgs !== null && typeof arrgs !== 'object') return '' + arrgs;
		else return '';

	}

	function computeText(args) {
		return computeTextUnit(sortArgs(args));
	}

	function concatArray(head, tail)
	{
		tail.unshift(head);
		
		var arr ='';
		tail.forEach(function(item)
		{
			if(item.length != undefined)
			{
				item.forEach(function(foo)
				{
					if(typeof foo == "object")
					{
						if(foo==null)
						{
							arr+= ' ';
						}
						else
						{
						arr += reconstruction(foo);

						}
					}
					else
					{
						arr += foo;
					}
				
				})
			}
			else
			{
				arr += reconstruction(item);
			}							
		});
		return arr;
	}

	function parseParams(functionName, params)
	{
		var answer = '';
		answer += functionName + "(";
		if(params != null)
		{
			params.forEach(function(param,index)
			{
				//console.log(param);
				answer += reconstruction(param) + (index < params.length -1 ?  ",": "");
			})
		}
		answer += ")";
		return answer;
	}

	function parseExpression(obj)
	{
		return reconstruction(obj.left) + obj.op + reconstruction(obj.right);
	}

	function reconstruction(obj)
	{
		//console.log(obj);
		var response;
		if(obj != null)
		{
		switch(obj.type) {
			case "VAR":
				response = obj.value;
				break;
			case "STR":
				response = "'" + obj.value + "'";
				break;
			case "NUM":
				response = obj.value;
				break;
			case "FCALL":
				response = parseParams(obj.function, obj.params);
				break;
			case "EXPR":
				response = parseExpression(obj);
				break;
			case null:
				response = '';
				break;
			case undefined:
				response= '';
				break
			default:
				response= obj;
				break;
		}
		return response;
		}

	}

}


QlikLogFile
	= blocks

blocks
	= '\ufeff'? head:block tail:(newline block spaces?)* {
		return {
			blocks: tail.reduce(function(result, element) {
				if(element[1] !== null) return result.concat([element[1]]);
				else return result;
			}, [ head ])
			
		}
	}
   
// TODO
// - ALIAS
// - DIRECTORY
// - EXECUTE
// - FLUSHLOG
// - FORCE
// - LOOSEN
// - MAP
// - NULLASNULL
// - NULLASVALUE
// - REM
// - SQLCOLUMNS
// - SQLTABLES
// - SQLTYPES
// - UNMAP
// - UNTAG
// - SWITCH 
  
block
	= pf:rowPrefix? txt:($ spaces?) & spEndofrow
	{
		return {
			blockType: 'EMPTY',
			datetime: pf ? pf.datetime : false,
			rowNumber: pf ? pf.rowNumber : false,
			loc: location()
		};
	}
	
	/ pf:rowPrefix6Spaces spaces* txt:($ 'Execution Failed') & spEndofrow
	{
		return {
			blockType: 'FAILED',
			datetime: pf.datetime,
			loc: location()
		};
	}
	
	/ pf:rowPrefix6Spaces spaces* txt:($ 'Execution finished.') & spEndofrow
	{
		return {
			blockType: 'FINISHED',
			datetime: pf.datetime,
			loc: location()
		};
	}
	
	/ pf:rowPrefix6Spaces comment:scriptCommentBlock & spEndofrow
	{
		return {
			blockType: 'COMMENT',
			datetime: pf.datetime,
			block: comment,
			loc: location()
		};
	}
	
	/ pf:rowPrefix connectBlock:connectBlock & spEndofrow
	{
		return {
			blockType: 'CONNECT',
			datetime: pf.datetime,
			rowNumber: pf.rowNumber,
			block: connectBlock,
			loc: location()
		};
	}
	
	/ pf:rowPrefix hiddenBlock:hiddenBlock & spEndofrow
	{
		return {
			blockType: 'HIDDEN',
			datetime: pf.datetime,
			rowNumber: pf.rowNumber,
			block: hiddenBlock,
			loc: location()
		};
	}
	
	/ traceBlock:traceBlock & spEndofrow
	{
		return {
			blockType: 'TRACE',
			datetime: traceBlock.pf.datetime,
			rowNumber: traceBlock.pf.rowNumber,
			block: traceBlock.trace,
			loc: location()
		};
	}
	
	/ pf:rowPrefix block:whenBlock & spEndofrow
	{
		return block;
	}
	
	/ pf:rowPrefix block:blockContent & spEndofrow
	{
		return {
			blockType: block.type,
			datetime: pf.datetime,
			rowNumber: pf.rowNumber,
			block: block.block,
			loc: location()
		};
	}
	
	/ unknownBlock:unknownBlock & spEndofrow
	{
		return {
			blockType: 'UNKNOWN',
			unknown: unknownBlock,
			loc: location()
		};
	}
	
	
blockContent		=
	block:letSetBlock			{ return { type: 'LET SET',		block: block}; }
	/	block:ifBlock			{ return { type: 'IF',			block: block}; }
	/	block:elseBlock			{ return { type: 'ELSE',		block: block}; }
	/	block:endBlock			{ return { type: 'END',			block: block}; }
	/	block:loadBlock			{ return { type: 'LOAD',		block: block}; }
	/	block:dropBlock			{ return { type: 'DROP',		block: block}; }
	/	block:renameBlock		{ return { type: 'RENAME',		block: block}; }
	/	block:doBlock			{ return { type: 'DO',			block: block}; }
	/	block:loopUntilBlock	{ return { type: 'LOOP UNTIL',	block: block}; }
	/	block:exitBlock			{ return { type: 'EXIT',		block: block}; }
	/	block:declareBlock		{ return { type: 'DECLARE',		block: block}; }
	/	block:deriveBlock		{ return { type: 'DERIVE',		block: block}; }
	/	block:forBlock			{ return { type: 'FOR',			block: block}; }
	/	block:nextBlock			{ return { type: 'NEXT',		block: block}; }
	/	block:storeBlock		{ return { type: 'STORE',		block: block}; }
	/	block:sleepBlock		{ return { type: 'SLEEP',		block: block}; }
	/	block:binaryBlock		{ return { type: 'BINARY',		block: block}; }
	/	block:searchBlock		{ return { type: 'SEARCH',		block: block}; }
	/	block:subBlock			{ return { type: 'SUB',			block: block}; }
	/	block:callBlock			{ return { type: 'CALL',		block: block}; }
	/	block:starIsBlock		{ return { type: 'STAR IS',		block: block}; }
	/	block:sectionBlock		{ return { type: 'SECTION',		block: block}; }
	/	block:commentBlock		{ return { type: 'COMMENT',		block: block}; }
	/	block:tagBlock			{ return { type: 'TAG',			block: block}; }
	/	block:qualifyBlock		{ return { type: 'QUALIFY',		block: block}; }
	/	block:directBlock		{ return { type: 'DIRECT',		block: block}; }


/*
 * Blocks
 */
 
// UNKNOWN

unknownBlock		= endofrow

// WHEN

whenBlock
	= when:'WHEN'i sp1:spaces cond:expression sp2:spaces statement:blockContent
	{
		
		statement.when = cond;
		statement.txt = function () {   return computeText(arguments); };
		return statement;
	}


// HIDDEN

hiddenBlock			= $ (('*' / ' ' / ',')+ & spEndofrow)

// CONNECT

connectBlock
	= con1:connectBlockSep* head:connectBlockItem con2:connectBlockSep* tail:(connectBlockItem connectBlockSep*)* & spEndofrow
	{
	
		var retVal = [ head ].concat(tail.map(function(val){return val[0]; } )).reduce(function(result, val){
			if(result == -1) return -1;
			if(result == 0) {
				if(typeof val.connect == 'undefined') return result;
				if(val.connect == true) return true;
				if(val.connect == false) return false;
			}
			if(result == true) {
				if(typeof val.connect == 'undefined') return result;
				if(val.connect == true) return true;
				if(val.connect == false) return -1;
			}
			if(result == false) {
				if(typeof val.connect == 'undefined') return result;
				if(val.connect == true) return -1;
				if(val.connect == false) return false;
			}
		}, 0)
		
		return { connect: retVal};
	}


connectBlockItem
	= c:'CONNECT'i to:(spaces 'TO'i)?	{ return { connect: true, 		loc: location() } }
	/ c:'CUSTOM'i						{ return { connect: true, 		loc: location() } }
	/ d:'DISCONNECT'i					{ return { connect: false, 		loc: location() } }
	/ p:'PROVIDER'i						{ return { connect: undefined, 	loc: location() } }
	
connectBlockSep		= ' ' / '*'

// DIRECT

directBlock			=
		tbl:( tableName sep? )?
		dir:( 'DIRECT'i sep 'QUERY'i )
		dim:( sep 'DIMENSION'i sep directBlockFields )
		mea:( sep 'MEASURE'i sep directBlockFields )?
		dtl:( sep 'DETAIL'i sep resources )?
		frm:( sep 'FROM'i sep endofrow )
		whr:( sep 'WHERE'i sep directBlockWhere )?
		{
			return {
				dimension: dim[3].fields,
				measure: mea ? mea[3].fields : false,
				detail: dtl ? dtl[3] : false,
				from: frm[3],
				where: whr ? whr[3] : false,
				loc: location()
			}
		}
		
directBlockFields
	= head:directBlockField tail:(sep? ',' sep? directBlockField)*
	{ return { fields: [ head ].concat(tail ? tail.map(function(e) {return e[3];}) : [])} }
	
directBlockField
	= src:(directBlockNative / resource) sep1:sep as:'AS'i sep2:sep res:resource
	{ return { expr: src, field: res}; }
	/ resource

directBlockWhere	= directBlockNative

directBlockNative
	= native:'NATIVE'i sep1:sep? op:'(' sep2:sep? str:string sep3:sep? cp:')'
	{ return { type: 'NATIVE', value: str}; }


// QUALIFY

qualifyBlock
	= un:('UN'i)? qua:'QUALIFY'i sep:sep fields:searchBlockFields
	{
		return {
			unqualify: un ? true : false,
			fields : fields,
			loc: location()
		}
	}

// STAR IS

starIsBlock
	= $ 'STAR'i spaces 'IS'i spaces endofrow

// SECTION

sectionBlock
	= $ 'SECTION'i spaces endofrow

// COMMENT

commentBlock
	= $ 'COMMENT'i spaces endofrow

// SUB & CALL

subBlock
	= sub:'SUB'i sep1:sep name:resource params:( sep? '(' params:resources ')' { return params; } )?
	{ return { name: name, params: params}; }
	
callBlock
	= cal:'CALL'i sep1:sep name:resource params:( sep? '(' params:expressions ')' { return params; } )?
	{ return { name: name, params: params}; }


// SEARCH

searchBlock
	= search:'SEARCH'i sep1:sep dir:('INCLUDE'i / 'EXCLUDE'i) sep2:sep fields:searchBlockFields
	{ return { dir: dir, fields: fields.fields}}
	
searchBlockFields
	= head:searchBlockField tail:(sep? ',' sep? searchBlockField)*
	{ return { fields: [ head ].concat(tail ? tail.map(function(e) {return e[3];}) : [])} }
	
searchBlockField
	= resource
	/ '*'

// TAG

tagBlock
	= t:'TAG'i sep1:sep f:('FIELD'i sep)? res:resource sep2:sep w:'WITH'i sep3:sep tag:(string / $ ('$' resource))
	{ return { mode: 'SINGLE', resource: res, tag: tag} }
	/ t:'TAG'i sep1:sep f:'FIELDS'i sep2:sep res:resources sep3:sep u:'USING'i sep4:sep map:resource
	{ return { mode: 'MAP', resources: res, map: map} }

// COMMENT block
 
scriptCommentBlock
	= scriptComment:endofrow
	{ return { comment: scriptComment}}

// LET/SET block

letSetBlock			= 
	letset:('LET'i sep / 'SET'i sep)? sep1:sep? name:variableName sep2:sep? eq:'='
	value:letSetBlockValue
	{ return {
		type: letset ? letset[0] : 'LET',
		name: name,
		value: value.val,
		loc: location()
	}}
	
letSetBlockValue
	= & (sep? variableValue spEndofrow ( EOF / block )) sep3:sep? val:variableValue	{ return { val: val} }
	/ val:spaces? & spEndofrow														{ return { val: val} }

// IF block

ifBlock				=
	e:('ELSE'i spaces?)? i:'IF'i sp1:spaces condition:expression sp2:spaces t:'THEN'i
	{ return { condition: condition} } 

// LOAD block

loadBlock			=
	
	// PRECEDING LOAD + SUFFIXES + LOAD BLOCK

    precedings:	(loadBlockPrecedings	sep)
    prefixes:	(loadBlockPrefixes		sep)?
    load:		(loadBlockLoad			sep)
    source:		(loadBlockSource		sep)
    suffixes:	(loadBlockSuffixes		sep? newline)
    summary:	(loadBlockSum			)
	
    {
    	return {
				precedings:				precedings[0].precedings,
				prefixes: 				prefixes ? prefixes[0].prefixes : false,
				load:					load[0],
				source:					source[0],
				suffixes:				suffixes[0].suffixes,
				summary:				summary,
				loc: location()
        };
    }
	
	/ // SUFFIXES + LOAD BLOCK

    prefixes:	(loadBlockPrefixes		sep)?
    load:		(loadBlockLoad			sep)
    source:		(loadBlockSource		sep)
    suffixes:	(loadBlockSuffixes		sep? newline)
    summary:	(loadBlockSum			)
	
    {
    	return {
				prefixes: 				prefixes ? prefixes[0].prefixes : false,
				load:					load[0],
				source:					source[0],
				suffixes:				suffixes[0].suffixes,
				summary:				summary,
				loc: location()
        };
    }
	
	/ // PRECEDING LOAD + LOAD BLOCK

    precedings:	(loadBlockPrecedings	sep)
    prefixes:	(loadBlockPrefixes		sep)?
    load:		(loadBlockLoad			sep)
    source:		(loadBlockSource		sep? newline)
    summary:	(loadBlockSum			)

    {
    	return {
				precedings:				precedings[0].precedings,
				prefixes: 				prefixes ? prefixes[0].prefixes : false,
				load:					load[0],
				source:					source[0],
				summary:				summary,
				loc: location()
        };
    }
	
	/ // LOAD BLOCK

    prefixes:	(loadBlockPrefixes		sep)?
    load:		(loadBlockLoad			sep)
    source:		(loadBlockSource		sep? newline)
    summary:	(loadBlockSum			)
	
    {
    	return {
				prefixes: 				prefixes ? prefixes[0].prefixes : false,
				load:					load[0],
				source:					source[0],
				summary:				summary,
				loc: location()
        };
    }
	
	/ // PRECEDING LOAD + SUFFIXES + SQL BLOCK
	
	precedings:	(loadBlockPrecedings	sep)
	prefixes:	(loadBlockPrefixes		sep)?
	source:		(loadBlockSourceSQL		sep)
	suffixes:	(loadBlockSuffixes		sep? newline)
	summary:	(loadBlockSum			)
	
	{
    	return {
				precedings:				precedings[0].precedings,
				prefixes: 				prefixes ? prefixes[0].prefixes : false,
				source:					source[0],
				suffixes:				suffixes[0].suffixes,
				summary:				summary,
				loc: location()
        };
    }
	
	/ // SUFFIXES + SQL BLOCK
	
	prefixes:	(loadBlockPrefixes		sep)?
	source:		(loadBlockSourceSQL		sep)
	suffixes:	(loadBlockSuffixes		sep? newline)
	summary:	(loadBlockSum			)
	
	{
    	return {
				prefixes: 				prefixes ? prefixes[0].prefixes : false,
				source:					source[0],
				suffixes:				suffixes[0].suffixes,
				summary:				summary,
				loc: location()
        };
    }
	
	/ // PRECEDING LOAD + SQL BLOCK
	
	precedings:	(loadBlockPrecedings	sep)
	prefixes:	(loadBlockPrefixes		sep)?
	source:		(loadBlockSourceSQL		sep? newline)
	summary:	(loadBlockSum			)
	
	{
    	return {
				precedings:				precedings[0].precedings,
				prefixes: 				prefixes ? prefixes[0].prefixes : false,
				source:					source[0],
				summary:				summary,
				loc: location()
        };
    }
	
	/ // SQL BLOCK
	
	prefixes:	(loadBlockPrefixes		sep)?
	source:		(loadBlockSourceSQL		sep? newline)
	summary:	(loadBlockSum			)
	
	{
    	return {
				prefixes: 				prefixes ? prefixes[0].prefixes : false,
				source:					source[0],
				summary:				summary,
				loc: location()
        };
    }
	
	/
	
	// PRECEDING LOAD + SUFFIXES + LOAD BLOCK NOSOURCE

    precedings:	(loadBlockPrecedings	sep)
    prefixes:	(loadBlockPrefixes		sep)?
    load:		(loadBlockLoad			sep)
    suffixes:	(loadBlockSuffixes		)
	
    {
    	return {
				precedings:				precedings[0].precedings,
				prefixes: 				prefixes ? prefixes[0].prefixes : false,
				load:					load[0],
				suffixes:				suffixes.suffixes,
				loc: location()
        };
    }
	
	/ // SUFFIXES + LOAD BLOCK NOSOURCE

    prefixes:	(loadBlockPrefixes		sep)?
    load:		(loadBlockLoad			sep)
    suffixes:	(loadBlockSuffixes		)
	
    {
    	return {
				prefixes: 				prefixes ? prefixes[0].prefixes : false,
				load:					load[0],
				suffixes:				suffixes.suffixes,
				loc: location()
        };
    }
	
	/ // PRECEDING LOAD + LOAD BLOCK NOSOURCE

    precedings:	(loadBlockPrecedings	sep)
    prefixes:	(loadBlockPrefixes		sep)?
    load:		(loadBlockLoad			)

    {
    	return {
				precedings:				precedings[0].precedings,
				prefixes: 				prefixes ? prefixes[0].prefixes : false,
				load:					load,
				loc: location()
        };
    }
	
	/ // LOAD BLOCK NOSOURCE

    prefixes:	(loadBlockPrefixes		sep)?
    load:		(loadBlockLoad			)
	
    {
    	return {
				prefixes: 				prefixes ? prefixes[0].prefixes : false,
				load:					load,
				loc: location()
        };
    }
	
loadBlockPrecedings
	= head:loadBlockPreceding tail:(sep? loadBlockPreceding)*
	{
		return {
			precedings: tail.reduce(function(result, element) {
				return result.concat([element[1]])
			}, [ head ]),
			loc: location()
		};
		
    }

loadBlockPreceding 
	= prefixes:	(loadBlockPrefixes	sep)?
	load:		(loadBlockLoad		sep)
	suffixes:	(loadBlockSuffixes	)
	& (sep? loadBlock)
	
	{
		return {
				prefixes:			prefixes ? prefixes[0].prefixes : false,
				load:				load[0],
				suffixes:			suffixes.suffixes,
				loc: location()
		};
	}
	
	/
	
	prefixes:	(loadBlockPrefixes	sep)?
	load:		(loadBlockLoad		)
	& (sep? loadBlock)
	
	{
		return {
				prefixes:			prefixes ? prefixes[0].prefixes : false,
				load:				load,
				loc: location()
		};
	}
	
	

// PREFIXES
	
loadBlockPrefixes
	= head:loadBlockPrefix tail:(sep? loadBlockPrefix)*
	{
		return {
			prefixes: tail.reduce(function(result, element) {
				Object.keys(element[1]).forEach(function(key) {return result[key] = element[1][key];})
				return result;
			}, head),
			loc: location()
		};
    }

	
// TODO
// - Handle generic summary
// - KEEP
// - REPLACE
// - SAMPLE
// - SEMANTIC
// - UNLESS
	
loadBlockPrefix
	= prefix:tableName						{ return { table: prefix } }
	/ prefix:'MAPPING'i & sep				{ return { mapping: true } }
	/ prefix:loadBlockConcat				{ return { concat: prefix } }
	/ prefix:loadBlockJoin					{ return { join: prefix } }
	/ prefix:loadBlockInterval				{ return { interval: prefix } }
	/ prefix:loadBlockAdd					{ return { add: prefix } }
	/ prefix:loadBlockBuffer				{ return { buffer: prefix } }
	/ prefix:loadBlockBundle				{ return { bundle: prefix } }
	/ prefix:loadBlockCrosstable			{ return { crosstable: prefix } }
	/ prefix:loadBlockFirst					{ return { first: prefix } }
	/ prefix:'GENERIC'i & sep				{ return { generic: true } }
	/ prefix:loadBockHierarchy				{ return { hierarchy: prefix } }
	/ prefix:loadBockHierarchyBelongsTo		{ return { hierarchyBelongsTo: prefix } }

loadBlockConcat
	= concat:'CONCATENATE'i name:(
      	sep1:sep? op:'(' sep2:sep? name:resource sep3:sep? cp:')'		{ return { name: name 					 }}
        / & sep															{ return { name: false				 }}
    )																{ return { concat: true, name: name.name 	 }}
	/ noconcat:'NOCONCATENATE'i & sep								{ return { concat: false 					 }}
	
loadBlockJoin
	= dir:(
		'LEFT'i sep
		/ 'RIGHT'i sep
		/ 'INNER'i sep
		/ 'OUTER'i sep
	)? j:'JOIN'i name:loadBlockJoinName
	{ return { join: true, direction: dir ? dir[0] : false, name: name.name} }
	
loadBlockJoinName
	= sep1:sep? op:'(' sep2:sep? name:resource sep3:sep? cp:')'	{ return { name: name,	loc: location() } }
	/ & sep														{ return { name: false,	txt: function() {return '';} } }
	
loadBlockInterval
	= i:'INTERVALMATCH'i sep1:sep? op:'(' sep2:sep? name:resource sep3:sep? cp:')'
	{ return { name: name} }
	
loadBlockAdd
	= a:'ADD'i only:(sep 'ONLY'i)? & sep
	{ return { add: true, only: (only) ? true : false} }
	
loadBlockBuffer
	= b:'BUFFER'i bp:(
		sep? '(' sep? options:loadBlockBufferOptions sep? ')'
		/ & sep
	)
	{ return { buffer: true, options: options.options} }
	
loadBlockBufferOptions
	= head:loadBlockBufferOption tail:(sep? ',' sep? loadBlockBufferOption)*
	{
		return {
			options: tail.reduce(function(result, element) {
				Object.keys(element[1]).forEach(function(key){ return result[key] = element[1][key];})
				return result;
			}, head),
			loc: location()
		}
    }
	
loadBlockBufferOption
	= i:'INCREMENTAL'i
	{ return { incremental: true}; }
	/ s:'STALE'i after:( sep 'AFTER'i )? sep1:sep duration:integer unit:( sep ( 'DAYS'i / 'HOURS'i ))?
	{ return { stale: true, after: (after) ? true : false, duration: duration, unit: (unit) ? unit[1] : 'DAYS'} }

loadBlockBundle
	= $ 'BUNDLE'i ( sep 'INFO'i )? & sep
	
loadBlockCrosstable
	= c:'CROSSTABLE'i sep1:sep? op:'('
	sep2:sep? attribute:resource sep3:sep? c1:','
	sep4:sep? data:resource sep5:sep? n:( ','
	sep? integer sep? )?
	cp:')'
	{
		return {
			attribute: attribute,
			data: data,
			n: (n) ? n[2] : false,
			loc: location()
		}
	}
	
loadBlockFirst
	= f:'FIRST'i n:loadBlockFirstN
	{ return { first: n.n} }
	
loadBlockFirstN
	= sep1:sep n:integer										{ return { n: n} }
	/ sep1:sep? op:'(' sep2:sep? n:integer sep3:sep? cp:')'		{ return { n: n} }
	
loadBockHierarchy
	= h:'HIERARCHY'i s0:sep? op:'(' s1:sep?
		nodeId:loadBockHierarchyResSep
		parentId:loadBockHierarchyResSepComma
		nodeName:loadBockHierarchyResSepComma
		parentName:loadBockHierarchyResSepComma?
		pathSource:loadBockHierarchyResSepComma?
		pathName:loadBockHierarchyResSepComma?
		pathDelimiter:loadBockHierarchyResSepComma?
		depth:loadBockHierarchyResSepComma?
	cp:')'
	{
		return {
			nodeId:			nodeId.res,
			parentId:		parentId.res,
			nodeName:		nodeName.res,
			parentName:		(parentName) ? parentName.res : false,
			pathSource:		(pathSource) ? pathSource.res : false,
			pathName:		(pathName) ? pathName.res : false,
			pathDelimiter:	(pathDelimiter) ? pathDelimiter.res : false,
			depth:			(depth) ? depth.res : false,
			txt:			function () {   return computeText(arguments); }
		}
	}

loadBockHierarchyResSep
	= res:resource s:sep?
	{ return { res: res}}
	
loadBockHierarchyResSepComma
	= c:',' s:sep? res:loadBockHierarchyResSep?
	{ return { res: res ? res.res : false}}
	
loadBockHierarchyBelongsTo
	= h:'HIERARCHYBELONGSTO'i s0:sep? op:'(' s1:sep?
		nodeId:loadBockHierarchyResSep
		parentId:loadBockHierarchyResSepComma
		nodeName:loadBockHierarchyResSepComma
		ancestorId:loadBockHierarchyResSepComma
		ancestorName:loadBockHierarchyResSepComma
		depthDiff:loadBockHierarchyResSepComma?
	cp:')'
	{
		return {
			nodeId:			nodeId.res,
			parentId:		parentId.res,
			nodeName:		nodeName.res,
			ancestorId:		ancestorId.res,
			ancestorName:	ancestorName.res,
			depthDiff:		(depthDiff) ? depthDiff.res : false,
			txt:			function () {   return computeText(arguments); }
		}
	}

	
// LOAD
	
loadBlockLoad		=
	load:		('LOAD'i			sep)
	distinct:	('DISTINCT'i		sep)?
	fields:		(loadBlockFields	)
	{
		return {
			distinct: distinct ? true : false,
			fields: fields.fields,
			loc: location()
		};
	}
	
loadBlockFields
	= head:loadBlockField tail:(sep? ',' sep? loadBlockField)*
	{
		return {
			fields: tail.reduce(function(result, element) {
				return result.concat([element[3]])
			}, [ head ]),
			loc: location()
		};
		
    }
	
loadBlockField
	= '*'
	/ expr:expression as:(sep? 'AS'i sep? resource)? {
		return {
			expr: expr,
			field: (as && as[3]) ? as[3].value : expr.value,
			loc: location()
		}
	}


// SOURCE

loadBlockSource
	= (
		  loadBlockSourceInline
		/ loadBlockSourceSQL
		/ loadBlockSourceResident
		/ loadBlockSourceAutogenerate
		/ loadBlockSourceFrom
	)

loadBlockSourceInline		=
	src:('INLINE'i )						sep1:sep
	ob:'['									sep2:sep?
		data: loadBlockSourceInlineRows
	cb:']'
	{
		return {
			loadBlockType: 'INLINE',

			data: {
				from: data.txt,
				lib: false,
				table: false,
				params: false,
			
				fields: data.fields,
				rows: data.rows
			},
			
			loc: location()
		}
	}

loadBlockSourceInlineRows 	=
	header:	(loadBlockSourceInlineHeader)
	rows:	(sep	loadBlockSourceInlineRow)*
	{
		return {
			fields: header.split(',').map(function(field) {return field.trim();}),
			rows: rows.map(function(row) {return row[1];}),
			loc: location()
		}
	}
	
loadBlockSourceInlineHeader	= endofinlinerow
loadBlockSourceInlineRow	= endofinlinerow

endofinlinerow				= chars:[^\]\r\n]*						{ return chars.join(""); }

loadBlockSourceSQL			=
	s:('SQL'i & ( sep 'SELECT'i ) / & 'SELECT'i )  values:(endofrow sep)* value:endofrow
	{
		return {
			loadBlockType: 'SQL',

			data: {
				from: values.map(function(row) {return row.join('');}).join('') + value,
				lib: false,
				table: false,
				params: false,
			}
		}
	}
	
loadBlockSourceResident			=
	r:('RESIDENT'i ) sep1:sep source:resource
	{
		return {
			loadBlockType: 'RESIDENT',

			data: {
				from: source.value,
				lib: false,
				table: source.value,
				params: false
			}
		}
	}
	
loadBlockSourceAutogenerate		=
	a:('AUTOGENERATE'i ) sep:( sep / & '(' ) expr:expression
	{
		return {
			loadBlockType: 'AUTOGENERATE',

			data: {
				from: computeText(arguments),
				lib: false,
				table: false,
				params: false,
			
				value: expr
			}
		}
	}
	
loadBlockSourceFrom		=
	f:('FROM'i ) sep1:sep src:resource params:(sep? '(' loadBlockSourceFromParams ')')?
	{
		return {
			loadBlockType: 'FROM',

			data: {
				from: src.value,
				lib: false,
				table: false,
				params: params ? params[2].params : false
			}
		}
	}
	
loadBlockSourceFromParams
	= head:loadBlockSourceFromParam tail:(sep? ',' sep loadBlockSourceFromParam)*
	{
		return {
			params:tail.reduce(function(result, element) {
				return result.concat([element[3]])
			}, [ head ])
		}
		
    }
	
loadBlockSourceFromParam
	= d:'delimiter'i sp1:spaces i:'is'i sp2:spaces delim:resource				{ return { delimiter: true, value: delim.value}; }
	/ t:'table'i sp1:spaces 'is'i sp2:spaces table:resource						{ return { table: true, value: table.value}; }
	/ chars:[^,\)]*																{ return chars.join(''); }

	
// SUFFIXES
	
loadBlockSuffixes
	= head:loadBlockSuffix tail:(sep loadBlockSuffix)*
	{
		return {
			suffixes:tail.reduce(function(result, element) {
				Object.keys(element[1]).forEach(function(key){ return result[key] = element[1][key];})
				return result;
			}, head)
		};
    }
	
loadBlockSuffix
	= suffix:'WHILE'i s1:sep exprWhile:expression										{ return { while: exprWhile 				}}
	/ suffix:'WHERE'i s1:sep exprWhere:expression										{ return { where: exprWhere 				}}
	/ suffix:'GROUP'i s1:spaces b:'BY'i s2:sep groupbyFields:loadBlockGroupByFields		{ return { groupby: groupbyFields.fields 	 }}
	/ suffix:'ORDER'i s1:spaces b:'BY'i s2:sep orderbyFields:loadBlockOrderByFields		{ return { orderby: orderbyFields.fields 	}}

loadBlockGroupByFields
	= head:loadBlockGroupByField tail:(sep? ',' sep? loadBlockGroupByField)*
	{
		return {
			fields: tail.reduce(function(result, element) {
				return result.concat([element[3]])
			}, [ head ])
		};
    }
	
loadBlockGroupByField
	= resource
	
loadBlockOrderByFields
	= head:loadBlockOrderByField tail:(sep? ',' sep? loadBlockOrderByField)*
	{
		return {
			fields: tail.reduce(function(result, element) {
				return result.concat([element[3]])
			}, [ head ])
		}
    }
	
loadBlockOrderByField
	= $ resource (sep ('ASC'i / 'DESC'i))?
	

// SUMMARY
	
loadBlockSum		=
	rowPrefix6Spaces sum1:loadBlockSummaryError
	{
		return {
			error: sum1.error,
			sum: [{
				sum1: sum1.sum,
				sum2: false
			}]
		}
	}
	
	/
	
	rowPrefix6Spaces sum11:(loadBlockSummary1) nl1:newline
	rowPrefix6Spaces sum12:(loadBlockSummary2) nl2:newline
	rowPrefix6Spaces sum21:(loadBlockSummary1) nl3:newline
	rowPrefix6Spaces sum22:(loadBlockSummary2)
	{
		return {
			error: false,
			sum: [{
				sum1: sum11.sum,
				sum2: sum12.sum
			}, {
				sum1: sum21.sum,
				sum2: sum22.sum
			}]
		}
	}
	
	/
	
	rowPrefix6Spaces sum1:(loadBlockSummary1) nl:newline
	rowPrefix6Spaces sum2:(loadBlockSummaryError)
	{
		return {
			error: sum2.error,
			sum: [{
				sum1: sum1.sum,
				sum2: sum2.sum
			}]
		}
	}
	
	/
	
	rowPrefix6Spaces sum1:(loadBlockSummary1) nl:newline
	rowPrefix6Spaces sum2:(loadBlockSummary2)
	{
		return {
			error: sum2.error,
			sum: [{
				sum1: sum1.sum,
				sum2: sum2.sum
			}]
		}
	}
	
	

loadBlockSummaryError			=
	'Error:' spaces? msg:endofrow
	{
		return {
			error: true,
			sum: msg
		};
	}
	
loadBlockSummary1				=
	sp1:' '* tb1:'\t' noffields:[0-9]+ sp2:spaces? ff:'fields found: ' list:[^\r\n]+
	{
		var fieldList = list.join("")
			.split(',')
			.map(function(field) {return field.trim();})
			.filter(function(field) {return field.length > 0;});
		
		return {
			error: false,
			sum: (fieldList.length == parseInt(noffields.join(''))) ? fieldList : false
		};
	}
	
loadBlockSummary2				=
	sp1:' '* nofrows:([0-9] / '\xa0' / '.' / ',')+ sp2:spaces? lf:'lines fetched'
	{
		return {
			error: false,
			sum: parseInt(nofrows.filter(function(d) {return !isNaN(d);}).join(""))
		};
	}

	
// TRACE block. Single & multiple rows are handled

traceBlock						=
	pf1:rowPrefix t:'TRACE'i s1:spaces trace1:endofrow newline
		
	pf2:rowPrefix spaces? endofrow & { return pf2.rowNumber == pf1.rowNumber; }

	{
		return { pf: pf1, trace: trace1, txt: function() {return t + s1 + trace1;} };
	}
	
	/
	
	pf1:rowPrefix t:'TRACE'i s1:spaces trace1:endofrow newline
	
	tracen:(
	
		pfn:rowPrefix spaces? tracen:endofrow newline & { return pfn.rowNumber > pf1.rowNumber; }
		
		& (pfm:rowPrefix spaces? endofrow newline & { return pfm.rowNumber > pf1.rowNumber; })
		
		{ return tracen; }
		
	)*
	
	pfm:rowPrefix spaces? tracem:endofrow newline & { return pfm.rowNumber > pf1.rowNumber; }
		
	pf2:rowPrefix spaces? endofrow & { return pf2.rowNumber == pf1.rowNumber; }
	
	(newline pfn:rowPrefix spaces? endofrow  & { return pfn.rowNumber <= pfm.rowNumber; })+

	{
		var msg = [ trace1 ].concat(tracen).concat(tracem).join('\r\n');
		return {pf: pf1, trace: msg, txt: function() { return t + s1 + msg; } };
	}

// DROP block

dropBlock
	= d:'DROP'i s1:sep type:('FIELD'i / 'TABLE'i) s:('S'i)? s2:sep resources:resources from:dropBlockFrom?
	{
		return {
			type: type,
			drop: resources,
			from: from ? from.res : false,
			loc: location()
		}
	}
	
dropBlockFrom
	= s3:sep f:'FROM'i s4:sep res:resources
	{ return { res: res}}

// RENAME block

renameBlock
	= r:'RENAME'i s1:sep f:('FIELD'i / 'TABLE'i) s:('S'i)? s2:sep u:'USING'i s3:sep using:resource
	{
		return {
			using: using,
			loc: location()
		}
	}
	/ 'RENAME'i sep ('FIELD'i / 'TABLE'i) ('S'i)? sep fromTo:renameBlockFromTo fromTos:renameBlockFromToSepComma*
	{
		return {
			fromTos: [fromTo].concat(fromTos ? fromTos.map(function(fromTo) {return fromTo.fromTo;}) : []),
			loc: location()
		}
	}
  
renameBlockFromToSepComma
	= s1:sep? c:',' s2:sep? fromTo:renameBlockFromTo
	{ return { fromTo: fromTo}}
  
renameBlockFromTo
	= from:resource s1:sep t:'TO'i s2:sep to:resource
	{ return { from: from, to: to}}

// DO block

doBlock
	= 'DO'i w:doBlockWhile?
	{ return { while: w ? w.expr : false}}
	
doBlockWhile
	= s1:sep w:'WHILE'i s2:sep expr:expression
	{ return { expr: expr}}

// LOOP UNTIL block

loopUntilBlock					= 'LOOP'i until:(sep 'UNTIL'i sep condition:expression { return condition })? { return { until: until ? until : false }; }

// EXIT block

exitBlock						= 'EXIT'i (sep ('DO'i / 'SCRIPT'i))?

// DECLARE block

declareBlock					=
	table:	(tableName 														sep)
	head:	('DECLARE FIELD DEFINITION TAGGED'i spaces ( '(' singleQuoteString ')' / singleQuoteString )	sep)
	params:	(
				'Parameters'i												sep
				variableName spaces? '=' spaces? variableValue				sep
	) ?
	fields:	(
				'Fields'i													sep
				declareBlockFields
	)
	{
		return false;
	}
	
declareBlockFields
	= head:declareBlockField tail:(sep? ',' sep? declareBlockField)*
	{
		return tail.reduce(function(result, element) {
			return result.concat([element[3]])
		}, [ head ]);
    }
	
declareBlockField
	= '*'
	/ expr:expression as:(sep 'AS'i sep resource (sep 'TAGGED'i (spaces singleQuoteString / spaces? '(' singleQuoteStrings ')'))?)?
	{
		return {
			expr: expr,
			field: (as && as[3]) ? as[3] : expr.value
		}
	}

// DERIVE block

deriveBlock						= 'DERIVE'i sep 'FIELDS'i spaces endofrow { return false; }

// FOR block

forBlock
	= 'FOR'i spaces variable:resource spaces '=' spaces from:expression spaces 'TO'i spaces to:expression step:(spaces 'STEP'i spaces expression)?
	{
		return {
			each: false,
			variable: variable,
			from: from,
			to: to,
			step: step ? step[3] : false
		};
	}
	/
	'FOR'i spaces 'EACH'i spaces variable:resource spaces 'IN'i spaces inexp:forEachBlockIns
	{
		return {
			each: true,
			variable: variable,
			inexp: inexp
		};
	}
	
forEachBlockIns
	= head:forEachBlockIn tail:(sep? ',' sep? forEachBlockIn)*
	{
		return tail.reduce(function(result, element) {
			return result.concat([element[3]])
		}, [ head ]);
    }
	
forEachBlockIn
	= expr:string																{ return { type: 'STR', value: expr }; }
	/ name:'FILELIST'i spaces? '(' spaces? mask:expression spaces? ')'			{ return { type: "FCALL", function: name, params: [ mask ] }; }
	/ name:'DIRLIST'i spaces? '(' spaces? mask:expression spaces? ')'			{ return { type: "FCALL", function: name, params: [ mask ] }; }
	/ name:'FIELDVALUELIST'i spaces? '(' spaces? mask:expression spaces? ')'	{ return { type: "FCALL", function: name, params: [ mask ] }; }
    / expr:expression															{ return { type: 'EXPR', value: expr }; }
	
// NEXT block

nextBlock 						= 'NEXT'i (spaces resource)? { return false; }
	
// ELSE block

elseBlock 						= 'ELSE'i { return false; }
	
// END block

endBlock 						= 'END'i spaces? end:( 'IF'i / 'SUB'i ) { return false; }
	
// STORE block

storeBlock 
	= 'STORE'i sep res:resource sep 'INTO'i sep into:resource params:(sep? '(' sep? params:loadBlockSourceFromParams sep? ')' { return params; })?
	{
		return {
			res: res,
			into: into,
			params: params ? params : false
		}
	}

// SLEEP block

sleepBlock						= 'SLEEP'i spaces sleep:integer { return sleep; }
	
// BINARY block

binaryBlock						= 'BINARY'i spaces bin:resource { return bin; }


/*
 * Expressions
 */

expressions
	= head:expression tail:(sep? ',' sep? expression?)*
	{
		return tail.reduce(function(result, element) {
			return result.concat([element[3]])
		}, [ head ]);
    }
	
expression
	= expr:conditionORExpression
	{
		return expr;
	}
	
// OR has a lower priority so rule evaluation is 1st in order
	
conditionORExpression
	= head:conditionANDExpression tail:(sep? conditionOROperator sep? conditionANDExpression)*
	{
		if (tail.length == 0) {
			return head;
		} else {
			var retVal = tail.reduce(function(result, element) {
				return { type: 'EXPR', op: element[1], left: result, right: element[3], raw: JSON.stringify(result) + element[1] + JSON.stringify(element[3])}
			}, head)
			retVal.txt = concatArray(head,tail);
			return retVal;
		}
    }

conditionOROperator		= op: ( 'OR'i / 'XOR'i ) & ( sep / '(' ) 			{ return op; }

// AND has a higher priority so rule evaluation is 2nd in order

conditionANDExpression
	= head:conditionNOTExpression tail:(sep? conditionANDOperator sep? conditionNOTExpression)*
	{
		if (tail.length == 0) {
			return head;
		} else {
			var retVal = tail.reduce(function(result, element) {
				return { type: 'EXPR', op: element[1], left: result, right: element[3], raw: JSON.stringify(result) + element[1] + JSON.stringify(element[3])}
			}, head)
			retVal.txt = concatArray(head,tail);
			return retVal;
		}
    }
	
conditionANDOperator	= op:'AND'i & ( sep / '(' ) 						{ return op; }

// NOT has a higher priority so rule evaluation is last in order
	
conditionNOTExpression
	= tail:(conditionNOTOperator sep? comparisonExpression)+
	{
		var retVal = tail.reduce(function(result, element) {
			return { type: 'EXPR', op: element[0], left: element[2], right: false, raw: JSON.stringify(element[2]) + JSON.stringify(element[0])}
		}, [])
		retVal.txt = concatArray(head,tail);
		return retVal;
    }
	/ comparisonExpression

conditionNOTOperator		= op:'NOT'i & ( sep / '(' )						{ return op; }

comparisonExpression
	= left:calculationExpression sep? op:comparisonOperator sep? right:calculationExpression {
		return { type: 'EXPR', op: op, left: left, right: right, raw:JSON.stringify(left) + op + JSON.stringify(right) }
    }
	/ left:calculationExpression { return left; }

comparisonOperator	= '=' / '<>' / '>=' / '<=' / '>' / '<' / 'LIKE'i & sep

calculationExpression
	= calculationStringExpression
	
calculationStringExpression
	= head:calculationAddExpression tail:(sep? calculationStringOperator sep? calculationAddExpression)*
	{
		if (tail.length == 0) {
			return head;
		} else {
			var retVal = tail.reduce(function(result, element) {
				return { type: 'EXPR', op: element[1], left: result, right: element[3]}
			}, head);
			retVal.txt = concatArray(head,tail);
			return retVal;
		}
    }
	
calculationStringOperator = '&'
	
calculationAddExpression
	= head:calculationFactExpression tail:(sep? calculationAddOperator sep? calculationFactExpression)*
	{
		if (tail.length == 0) {
			return head;
		} else {
			var retVal = tail.reduce(function(result, element) {
				return { type: 'EXPR', op: element[1], left: result, right: element[3], raw: JSON.stringify(result) + element[1] + JSON.stringify(element[3])}
			}, head);
			retVal.txt = concatArray(head,tail);
			return retVal;
		}
    }
	
calculationAddOperator = '+' / '-'
	
calculationFactExpression
	= head:termExpression tail:(sep? calculationFactOperator sep? termExpression)*
	{
		if (tail.length == 0) {
			return head;
		} else {
			var retVal = tail.reduce(function(result, element) {
				return { type: 'EXPR', op: element[1], left: result, right: element[3], raw: JSON.stringify(result) + element[1] + JSON.stringify(element[3])}
			}, head);
			retVal.txt = concatArray(head,tail);
			return retVal;
		}
    }

calculationFactOperator = ((! (connectBlock / '*' sep '*')) '*' ) / '/'
  
termExpression
	= op:"(" sp1:sep? expr:expression sp2:sep? cp:")"		{ return { type: 'EXPR', op: false, left: expr, right: false 	}; }
	/ expr:number											{ return { type: 'NUM', value: expr 							}; }	
	/ expr:singleQuoteString								{ return expr; }
	/ expr:functionCall										{ return expr; }
	/ expr:('TRUE'i / 'FALSE'i)								{ return { type: 'BOOL', value: expr 							}; }
	/ expr:resource											{ return { type: 'VAR', value: expr.value 						}; }
	/ expr:('$' [0-9])										{ return { type: 'PARAM', value: expr 							}; }

functionCall		= 	name:functionName sp1:sep? op:'(' sp2:sep? d:'DISTINCT'i? sp3:sep? params:functionParameters? sp4:sep? cp:')'
						{ return { type: "FCALL", function: name, params: params, txt: parseParams(name,params)}; }

fp					= & (sep? '(')

functionName					 	
/* Aggregation					*/	= func:(
									  'FirstSortedValue'i fp	/ 'Min'i fp					/ 'Max'i fp					/ 'Mode'i fp				/ 'Only'i fp
									/ 'Sum'i fp					/ 'Count'i fp				/ 'MissingCount'i fp		/ 'NullCount'i fp			/ 'NumericCount'i fp
									/ 'TextCount'i fp			/ 'IRR'i fp					/ 'XIRR'i fp				/ 'NPV'i fp					/ 'XNPV'i fp
									/ 'Avg'i fp					/ 'Correl'i fp				/ 'Fractile'i fp			/ 'Kurtosis'i fp			/ 'LINEST_B'i fp
									/ 'LINEST_df'i fp			/ 'LINEST_f'i fp			/ 'LINEST_m'i fp			/ 'LINEST_r2'i fp			/ 'LINEST_seb'i fp
									/ 'LINEST_sem'i fp			/ 'LINEST_sey'i fp			/ 'LINEST_ssreg'i fp		/ 'Linest_ssresid'i fp		/ 'Median'i fp
									/ 'Skew'i fp				/ 'Stdev'i fp				/ 'Sterr'i fp				/ 'STEYX'i fp				/ 'Chi2Test_chi2'i fp
									/ 'Chi2Test_df'i fp			/ 'Chi2Test_p'i fp			/ 'ttest_conf'i fp			/ 'ttest_df'i fp			/ 'ttest_dif'i fp
									/ 'ttest_lower'i fp			/ 'ttest_sig'i fp			/ 'ttest_sterr'i fp			/ 'ttest_t'i fp				/ 'ttest_upper'i fp
									/ 'ztest_conf'i fp			/ 'ztest_dif'i fp			/ 'ztest_sig'i fp			/ 'ztest_sterr'i fp			/ 'ztest_z'i fp
									/ 'ztest_lower'i fp			/ 'ztest_upper'i fp			/ 'Concat'i fp				/ 'FirstValue'i fp			/ 'LastValue'i fp
									/ 'MaxString'i fp			/ 'MinString'i fp
									
/* Color						*/	/ 'ARGB'i fp				/ 'HSL'i fp					/ 'RGB'i fp					/ 'Color'i fp				/ 'Colormix1'i fp
									/ 'Colormix2'i fp			/ 'SysColor'i fp			/ 'ColorMapHue'i fp			/ 'ColorMapJet'i fp
									
/* Conditional					*/	/ 'alt'i fp					/ 'class'i fp				/ 'if'i fp					/ 'match'i fp				/ 'mixmatch'i fp
									/ 'pick'i fp				/ 'wildmatch'i fp
									
/* Counter						*/	/ 'autonumberhash128'i fp	/ 'autonumberhash256'i fp	/ 'autonumber'i fp			/ 'IterNo'i fp				/ 'RecNo'i fp
									/ 'RowNo'i fp
									
/* Date and time				*/	/ 'Date'i fp				/ 'weekyear'i fp			/ 'weekday'i fp				/ 'now'i fp					/ 'today'i fp
									/ 'LocalTime'i fp			/ 'makedate'i fp			/ 'makeweekdate'i fp		/ 'maketime'i fp			/ 'AddMonths'i fp
									/ 'AddYears'i fp			/ 'yeartodate'i fp			/ 'timezone'i fp			/ 'GMT'i fp					/ 'UTC'i fp
									/ 'daylightsaving'i fp		/ 'converttolocaltime'i fp	/ 'setdateyear'i fp			/ 'setdateyearmonth'i fp	/ 'inyeartodate'i fp
									/ 'inyear'i fp				/ 'inquarter'i fp			/ 'inquartertodate'i fp		/ 'inmonth'i fp				/ 'inmonthtodate'i fp
									/ 'inmonths'i fp			/ 'inmonthstodate'i fp		/ 'inweek'i fp				/ 'inweektodate'i fp		/ 'inlunarweek'i fp
									/ 'inlunarweektodate'i fp	/ 'inday'i fp				/ 'indaytotime'i fp			/ 'yearstart'i fp			/ 'yearend'i fp
									/ 'yearname'i fp			/ 'quarterstart'i fp		/ 'quarterend'i fp			/ 'quartername'i fp			/ 'monthstart'i fp
									/ 'monthend'i fp			/ 'monthname'i fp			/ 'monthsstart'i fp			/ 'monthsend'i fp			/ 'monthsname'i fp
									/ 'weekstart'i fp			/ 'weekend'i fp				/ 'weekname'i fp			/ 'lunarweekstart'i fp		/ 'lunarweekend'i fp
									/ 'lunarweekname'i fp		/ 'daystart'i fp			/ 'dayend'i fp				/ 'dayname'i fp				/ 'age'i fp
									/ 'networkdays'i fp			/ 'firstworkdate'i fp		/ 'lastworkdate'i fp		/ 'daynumberofyear'i fp		/ 'daynumberofquarter'i fp
									/ 'second'i fp				/ 'minute'i fp				/ 'hour'i fp				/ 'day'i fp					/ 'week'i fp
									/ 'month'i fp				/ 'year'i fp
									
/* Exponential and logarithmic	*/	/ 'exp'i fp					/ 'log'i fp					/ 'log10'i fp				/ 'pow'i fp					/ 'sqr'i fp
									/ 'sqrt'i fp
									
/* File							*/	/ 'Attribute'i fp			/ 'ConnectString'i fp		/ 'FileBaseName'i fp		/ 'FileDir'i fp				/ 'FileExtension'i fp
									/ 'FileName'i fp			/ 'FilePath'i fp			/ 'FileSize'i fp			/ 'FileTime'i fp			/ 'GetFolderPath'i fp
									/ 'QvdCreateTime'i fp		/ 'QvdFieldName'i fp		/ 'QvdNoOfFields'i fp		/ 'QvdNoOfRecords'i fp		/ 'QvdTableName'i fp

/* Financial					*/	/ 'FV'i fp					/ 'nPer'i fp				/ 'Pmt'i fp					/ 'PV'i fp					/ 'Rate'i fp

/* Formatting					*/	/ 'ApplyCodepage'i fp		/ 'Dual'i fp				/ 'Num'i fp					/ 'Timestamp'i fp			/ 'Time'i fp
									/ 'Interval'i fp			/ 'Money'i fp
									
/* General numeric				*/	/ 'bitcount'i fp			/ 'div'i fp					/ 'fabs'i fp				/ 'fact'i fp				/ 'frac'i fp
									/ 'sign'i fp				/ 'combin'i fp				/ 'permut'i fp				/ 'fmod'i fp				/ 'mod'i fp
									/ 'even'i fp				/ 'odd'i fp					/ 'ceil'i fp				/ 'floor'i fp				/ 'round'i fp
									
/* Geospatial					*/	/ 'GeoAggrGeometry'i fp		/ 'GeoBoundingBox'i fp		/ 'GeoCountVertex'i fp		/ 'GeoInvProjectGeometry'i fp
									/ 'GeoProjectGeometry'i fp	/ 'GeoReduceGeometry'i fp	/ 'GeoGetBoundingBox'i fp	/ 'GeoGetPolygonCenter'i fp
									/ 'GeoMakePoint'i fp		/ 'GeoProject'i fp
									
/* Interpretation				*/	/ 'Date#'i fp				/ 'Interval#'i fp			/ 'Num#'i fp				/ 'Time#'i fp				/ 'Timestamp#'i fp
									/ 'Money#'i fp				/ 'Text'i fp
									
/* Inter-record					*/	/ 'Exists'i fp				/ 'LookUp'i fp				/ 'Peek'i fp				/ 'Previous'i fp			/ 'FieldValue'i fp

/* Logical						*/	/ 'IsNum'i fp				/ 'IsText'i fp

/* Mapping						*/	/ 'ApplyMap'i fp			/ 'MapSubstring'i fp

/* Mathematical					*/	/ 'e'i fp					/ 'false'i fp				/ 'pi'i fp					/ 'rand'i fp				/ 'true'i fp

/* NULL							*/	/ 'isnull'i fp				/ 'null'i fp

/* Range						*/	/ 'RangeMax'i fp			/ 'RangeMaxString'i fp		/ 'RangeMin'i fp			/ 'RangeMinString'i fp		/ 'RangeMode'i fp
									/ 'RangeOnly'i fp			/ 'RangeSum'i fp			/ 'RangeCount'i fp			/ 'RangeMissingCount'i fp	/ 'RangeNullCount'i fp
									/ 'RangeNumericCount'i fp	/ 'RangeTextCount'i fp		/ 'RangeAvg'i fp			/ 'RangeCorrel'i fp			/ 'RangeFractile'i fp
									/ 'RangeKurtosis'i fp		/ 'RangeSkew'i fp			/ 'RangeStdev'i fp			/ 'RangeIRR'i fp			/ 'RangeNPV'i fp
									/ 'RangeXIRR'i fp			/ 'RangeXNPV'i fp
									
/* Ranking in charts			*/	/ 'Rank'i fp				/ 'HRank'i fp

/* Statistical distribution		*/	/ 'CHIDIST'i fp				/ 'CHIINV'i fp				/ 'NORMDIST'i fp			/ 'NORMINV'i fp				/ 'TDIST'i fp
									/ 'TINV'i fp				/ 'FDIST'i fp				/ 'FINV'i fp
									
/* String						*/	/ 'Capitalize'i fp			/ 'Chr'i fp					/ 'Evaluate'i fp			/ 'FindOneOf'i fp			/ 'Hash128'i fp
									/ 'Hash160'i fp				/ 'Hash256'i fp				/ 'Index'i fp				/ 'KeepChar'i fp			/ 'Left'i fp
									/ 'Len'i fp					/ 'Lower'i fp				/ 'LTrim'i fp				/ 'Mid'i fp					/ 'Ord'i fp
									/ 'PurgeChar'i fp			/ 'Repeat'i fp				/ 'Replace'i fp				/ 'Right'i fp				/ 'RTrim'i fp
									/ 'SubField'i fp			/ 'SubStringCount'i fp		/ 'TextBetween'i fp			/ 'Trim'i fp				/ 'Upper'i fp
									
/* System						*/	/ 'Author'i fp				/ 'ClientPlatform'i fp		/ 'ComputerName'i fp		/ 'DocumentName'i fp		/ 'DocumentPath'i fp
									/ 'DocumentTitle'i fp		/ 'GetCollationLocale'i fp	/ 'GetObjectField'i fp		/ 'GetRegistryString'i fp	/ 'IsPartialReload'i fp
									/ 'OSUser'i fp				/ 'ProductVersion'i fp		/ 'ReloadTime'i fp			/ 'StateName'i fp
									
/* Table						*/	/ 'FieldName'i fp			/ 'FieldNumber'i fp			/ 'NoOfFields'i fp			/ 'NoOfRows'i fp			/ 'NoOfTables'i fp
									/ 'TableName'i fp			/ 'TableNumber'i fp
									
/* Trigonometric and hyperbolic	*/	/ 'cos'i fp					/ 'acos'i fp				/ 'sin'i fp					/ 'asin'i fp				/ 'tan'i fp
									/ 'atan'i fp				/ 'atan2'i fp				/ 'cosh'i fp				/ 'sinh'i fp				/ 'tanh'i fp
								) { return func[0]; }

functionParameters
	= expressions

/*
 * Misc.
 */

sep
	= chars:(sp1:spaces? nl:newline spaces? pf:rowPrefix sp2:spaces? { return (sp1 ? sp1 : '') + nl + (pf.sp ? pf.sp : '') + (sp2 ? sp2 : ''); } )+
		{ return chars.join(''); }
	/ chars:spaces
		{ return chars; }
 
tableName			= name:resource spaces? ':'																	{ return name;}

resources
	= head:resource tail:(sep? ',' sep? resource)*
	{
		return [head].concat(tail.map(function(res) { return res[3];}));
	}

resource			= name:(
						lib:'lib://' res:[^ \t\r\n()]+		{ return { value: lib + res.join(''), 					}; }
						/ name:('@'? alphanum)				{ return { value: (name[0] ? name[0] : '') + name[1], 	}; }
						/ name:braceQuoteString				
						/ name:doubleQuoteString
						/ name:singleQuoteString
						/ name:diagonalQuoteString
					)
					{ return name;}
					
variableName		= name:alphanum
variableValue 		= expression

rowPrefix			= pf:rowPrefixWoRn space scriptRowNumber:scriptRowNumber space sp:spaces?					{ return { datetime: pf.datetime, rowNumber: parseInt(scriptRowNumber), sp: (sp ? sp : false), txt: function() { return ''; } }; }
rowPrefix6Spaces	= pf:rowPrefixWoRn sixSpaces																{ return { datetime: pf.datetime }; }

rowPrefixWoRn		= spaces? datetime:datetime																	{ return { datetime: datetime}; }	
	
/*
 * Date & Time
 */
	
datetime			= date:date spaces time:time { return {date: date, time: time}; } 
date				= date:(digit digit digit digit '-' digit digit '-' digit digit) { return date.join(''); }
time				= time:(digit digit ':' digit digit ':' digit digit) { return time.join(''); }
	
scriptRowNumber		= scriptRowNumber:(digit digit digit digit) { return scriptRowNumber.join(''); }

/*
 * Spaces
 */

spacesNL			= spacesNL:(space / newline)+			{ return spacesNL.join(''); }
spaces				= spaces:space+							{ return spaces.join(''); }
sixSpaces			= spaces:(space space space space space space)
															{ return spaces.join(''); }

space				= chars:(' ' / '\t')					{ return chars; }

newline				= chars:('\r'? '\n') 					{ return chars.join(''); }

/*
 * Numbers
 */
number				= decimal / integer
decimal				= digits:('-'? digit+ '.' digit+ ) { return parseFloat((digits[0] ? digits[0] : '+') + digits[1].join("") + '.' + digits[3].join("")); }
integer				= digits:('-'? digit+) { return parseInt((digits[0] ? digits[0] : '+') + digits[1].join("")); }
digit				= [0-9]

/*
 * Strings
 */

alphanum			= chars:[a-zA-Z0-9\xC0-\xFF_\.%\?#°º$§]+	{ return chars.join(''); }
endofrow			= chars:[^\r\n]*							{ return chars.join(''); }
spEndofrow			= spaces? ( newline / EOF )
EOF					= !.

strings
	= head:string tail:(sep? ',' sep? string)*
	{
		return tail.reduce(function(result, element) {
			return result.concat([element[3]])
		}, [ head ]);
    }
	
string				= doubleQuoteString / singleQuoteString / diagonalQuoteStrings


/*
 * Double quoted strings
 */

doubleQuoteStrings
	= head:doubleQuoteString tail:(sep? ',' sep doubleQuoteString)*
	{
		return tail.reduce(function(result, element) {
			return result.concat([element[3]])
		}, [ head ]);
    }
	
doubleQuoteString
	= opq:doubleQuote chars:doubleQuotechar* cq:doubleQuote
	{
		return { type: 'STR', value: chars.map(function(char)  { return char.char;}).join('')};
	}

doubleQuotechar
 	= char:doubleQuoteUeChar
	{ return { char: char}}
	
	/ esc:doubleQuote sequence:(doubleQuote)
    { return { char: sequence}; }
	
    / sep:sep char:(doubleQuotechar / & doubleQuote)
    { return { char: sep + char}; }
    
doubleQuote			= "\""
doubleQuoteUeChar	= '\t' / [^\0-\x1F"]

/*
 * Single quoted strings
 */

singleQuoteStrings
	= head:singleQuoteString tail:(sep? ',' sep? singleQuoteString)*
	{
		return tail.reduce(function(result, element) {
			return result.concat([element[3]])
		}, [ head ]);
    }
	
singleQuoteString
	= oq:singleQuote chars:singleQuotechar* cq:singleQuote
	{
		return { type: 'STR', value: chars.map(function(char) {return char.char;}).join('')};
	}

singleQuotechar
 	= char:singleQuoteUeChar
	{ return { char: char}}
	
	/ esc:singleQuote sequence:(singleQuote)
    { return { char: sequence}; }
	
    / sep:sep char:(singleQuotechar / & singleQuote)
    { return { char: sep + char}; }
    
singleQuote			= "'"
singleQuoteUeChar	= '\t' / [^\0-\x1F']

/*
 * Diagonal quoted strings
 */

diagonalQuoteStrings
	= head:diagonalQuoteString tail:(sep? ',' sep? diagonalQuoteString)*
	{
		return tail.reduce(function(result, element) {
			return result.concat([element[3]])
		}, [ head ]);
    }
	
diagonalQuoteString
	= oq:diagonalQuote chars:diagonalQuotechar* cq:diagonalQuote
	{
		return { type: 'STR', value: chars.map(function(char) {return char.char;}).join('')};
	}

diagonalQuotechar
 	= char:diagonalQuoteUeChar
	{ return { char: char}}
	
	/ esc:diagonalQuote sequence:(diagonalQuote)
    { return { char: sequence}; }
	
    / sep:sep char:(diagonalQuotechar / & diagonalQuote)
    { return { char: sep + char}; }
    
diagonalQuote		= "`"
diagonalQuoteUeChar	= '\t' / [^\0-\x1F`]

/*
 * Braced quoted strings
 */
 
braceQuoteString
	= oq:openBrace chars:braceQuotechar* cq:closeBrace
	{
		return { type: 'STR', value: chars.map(function(char) {return char.char;}).join('')};
	}

braceQuotechar
 	= char:braceQuoteUeChar
	{ return { char: char}}
	
	/ esc:braceQuoteEscape sequence:(closeBrace)
    { return { char: sequence}; }
	
    / sep:sep char:(braceQuotechar / & closeBrace)
    { return { char: sep + char}; }

braceQuoteEscape	= '\\'
openBrace			= '['
closeBrace			= ']'
braceQuoteUeChar	= '\t' / [^\0-\x1F\]]

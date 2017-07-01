//Source code lent by POUC - https://github.com/pouc
//Latter might be updated by a basic version of https://github.com/pouc/qlik-script-log-parser
module.exports = {
	format: function format(parsedMeasure) {
		if (!Array.isArray(parsedMeasure))
			return parsedMeasure;
		
		switch(parsedMeasure[0]) {
			case 'aggrop':
			case 'op':
				return '(' + module.exports.format(parsedMeasure[2]) + ' ' + parsedMeasure[1] + ' ' + module.exports.format(parsedMeasure[3]) + ')';
			case 'aggr':
				return parsedMeasure[1] + '(' + module.exports.format(parsedMeasure[2]) + module.exports.format(parsedMeasure[3]) + ')';
			case 'aggrmod':
				return parsedMeasure[1].map(function(m) {
					return module.exports.format(m);
				}).join(' ') + ((parsedMeasure[1].length > 0) ? ' ' : '');
			case 'subset':
				return '{' + parsedMeasure[1] + '<' + module.exports.format(parsedMeasure[2]) + '>}';
			case 'setmod':
				return parsedMeasure[1].map(function(m) {
					return module.exports.format(m);
				}).join(', ');
			case 'setmoditem':
				return module.exports.format(parsedMeasure[1]) + ' = {"' + module.exports.format(parsedMeasure[2]) + '"}';
			case 'field':
				return '[' + parsedMeasure[1] + ']';
			default:
				return 'OMG!';
		}
	}, 
	
	parse: require('./qelParser.js').parse
}


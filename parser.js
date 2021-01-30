"use strict";

class Token {
	constructor(type, value, depth=null) {
		this.type = type;
		this.value = value;
		this.depth = depth;
	}

	parseEquals(token) {
		if (this.type == "special" || token.type == "special") {
			if (this.value == "add_sub" || token.value == "add_sub") {
				// matches either + or -
				return (this.value=="+"||this.value=="-"||token.value=="+"||token.value=="-")
			}
		} else if (this.type == "number") {
			return this.type == token.type;
		} else if (this.type == "operator") {
			return this.type == token.type && this.value == token.value;
		}
	}

	/**
	 * String representation of token
	 * @return {[type]} [description]
	 */
	str() {
		if (this.type == "number") {
			return `[${this.type.slice(0,3)} ${this.value}]`;
		} else if (this.type == "operator") {
			return `[${this.type.slice(0,2)} ${this.value}]`;
		} else {
			return `[${this.value}]`;
		}
	}
}

function printTokenList(tokenList, property="value", justReturn=false) {
	let string = tokenList.map(t=>t[property]).join(" ");
	if (justReturn) {
		return string;
	} else {
		console.log(string);
	}
}

class Expression {
	constructor() {
		this.tokens = [];
	}

	/**
	 * Check if character is a digit
	 * @param  {String}  chr Character, length should be 1
	 * @return {Boolean}     Is digit or not
	 */
	static isDigit(chr) {
		return !isNaN(chr);
	}

	/**
	 * Check if character is an operator
	 * @param  {String}  chr Character, length should be 1
	 * @return {Boolean}     Is operator or not
	 */
	static isOper(chr) {
		switch (chr) {
			case "+":
			case "-":
			case "*":
			case "/":
			case "(":
			case ")":
				return true;
			default:
				return false;
		}
	}

	/**
	 * Converts string expression to Expression instance
	 * @param  {String} string The string to convert
	 * @return {Expression}        The resulting expression
	 */
	static fromString(string) {
		let mem = new Expression();
		let pos_lastparsed = -1;
		for (var i = 0; i < string.length; i++) {
			let chr = string[i];
			if (this.isOper(chr)) {
				if (pos_lastparsed == i-1) {
					// previous chr was operator
				} else {
					// previous chr was number
					let numString = string.slice(pos_lastparsed+1, i);
					if (isNaN(numString)) {
						return `Parsing error: Can't convert "${numString}" to number`
					} else {
						mem.addToken("number", +numString);
					}
				}
				mem.addToken("operator", chr);
				pos_lastparsed = i;
			} else if (this.isDigit(chr)) {
				if (i==string.length-1) {
					// final token is number
					let numString = string.slice(pos_lastparsed+1, i+1);
					if (isNaN(numString)) {
						return `Parsing error: Can't convert "${numString}" to number`
					} else {
						mem.addToken("number", +numString);
						pos_lastparsed = i;
					}
				}
			} else {
				return `Parsing error: Unknown character "${chr}" encountered`
			}
		}
		return mem;
	}

	toString() {
		return this.tokens.map(t=>t.value).join("");
	}

	/**
	 * Add token to end of expression
	 * @param {"number"|"operator"} type  Type of token
	 * @param {number|String} value Value of token
	 */
	addToken(type, value) {
		let token = new Token(type, value);
		this.tokens.push(token);
	}

	/**
	 * Set `depth` of each token depending on nested brackets
	 */
	parseDepth() {
		let depth = 0;
		let setDepth = (token) => {
			if (token.type=="operator" && token.value=="(") depth += 1;
			if (token.type=="operator" && token.value==")") depth -= 1;
			token.depth = depth;
		}
		this.tokens.forEach(setDepth);
	}

	/**
	 * Check if depth of final token is 0
	 * If not, expression is invalid
	 * @return {Boolean} Validity of expression
	 */
	depthIsValid() {
		this.parseDepth();
		let lastToken = this.tokens[this.tokens.length-1];
		return lastToken.depth == 0;
	}

	/**
	 * Print all tokens in expression
	 */
	print() {
		let token;
		for (var i = 0; i < this.tokens.length; i++) {
			token = this.tokens[i];
			console.log(`${i}\t${token.value}\t${token.depth}\t${token.type}`);
		}
	}
}

class Evaluator {
	/**
	 * Create instance and define rules for evaluator
	 */
	constructor() {
		this.rules = this.createRules();
	}

	/**
	 * Parses an expression to get a value
	 * @param  {Expression} expression The expression to evaluate
	 * @return {number}            Output of evaluation
	 */
	parse(expression) {
		let depthValid = expression.depthIsValid();
		if (!depthValid) {return `Evaluation error: Bracket depth is invalid.`}
		// deep copy
		let tokens = expression.tokens.slice();
		let loopLimit = 0;
		while (tokens.length > 1){
			printTokenList(tokens);
			let deepestLevel = Math.max(...tokens.map(t=>t.depth));
			let didRule = false;
			for (let name in this.rules) {
				let rule = this.rules[name];
				let position = this.checkRule(tokens, rule, deepestLevel);
				if (position!=-1) {
					didRule = true;
					this.doRule(tokens, name, position);
					break;
				}
			}
			if (!didRule) {
				printTokenList(tokens);
				return "Evaluation error: Couldn't parse expression"
			}
			loopLimit++;
			if (loopLimit>35) {
				printTokenList(tokens);
				return "Evaluation error: Maximum loop length reached";
			}
		}
		return tokens[0].value;
	}

	/**
	 * Check a list of tokens for the given rule
	 * @param  {Token[]} tokenList List of tokens
	 * @param  {Token[]} rule      A rule, expressed as an array of tokens
	 * @param  {number} depthLevel      Depth level to check
	 * @param  {boolean} debug      Log debug messages
	 * @return {number}           Index of first token matching the rule, -1 indicates no match
	 */
	checkRule(tokenList, rule, depthLevel, debug=false) {
		debug && console.log(`Checking ${printTokenList(tokenList, "value", true)} for '${rule.map(t=>t.value).join("")}'`);
		for (var i = 0; i <= tokenList.length-rule.length; i++) {
			let isMatch;
			let currentDepth = tokenList[i].depth;
			if (currentDepth != depthLevel) {
				debug && console.log(`  Skipping Pos ${i}`);
				continue
			}
			debug && console.log(`  Pos ${i}:`);
			for (var j = 0; j < rule.length; j++) {
				isMatch = rule[j].parseEquals(tokenList[i+j]);
				if (!isMatch) {
					debug && console.log(`    FAIL: ${rule[j].str()}, ${tokenList[i+j].str()}`);
					break;
				} else {
					debug && console.log(`    ${rule[j].str()}, ${tokenList[i+j].str()}`);
				}
			}
			if (isMatch) {
				debug && console.log(`    Match success: pos ${i}`);
				return i;
			}
		}
		
		return -1;
	}

	createRules() {
		this.ADDSUB = new Token("special", "add_sub");
		this.SUB = new Token("operator", "-");
		this.MUL = new Token("operator", "*");
		this.DIV = new Token("operator", "/");
		this.L_BRACKET = new Token("operator", "(");
		this.R_BRACKET = new Token("operator", ")");
		this.NUMBER = new Token("number", "x");
		// ordered in order of priority
		return {
			exponentiation: [this.NUMBER, this.MUL, this.MUL, this.NUMBER],
			implied_multiply: [this.NUMBER, this.NUMBER],
			single_num: [this.L_BRACKET, this.NUMBER, this.R_BRACKET],
			empty_brackets: [this.L_BRACKET, this.R_BRACKET],
			divide: [this.NUMBER, this.DIV, this.NUMBER],
			multiply: [this.NUMBER, this.MUL, this.NUMBER],
			add_sub: [this.NUMBER, this.ADDSUB, this.NUMBER],
		};
	}

	/**
	 * Performs a rule on an expression, given the rule to perform and the position
	 * @param  {Token[]} tokenList The expression as a list of tokens
	 * @param  {String} ruleName  Name of the rule to perform
	 * @param  {number} position  Location to perform the rule
	 * @return {void}           Modifies the array in place
	 */
	doRule(tokenList, ruleName, position) {
		// modifies list in-place
		let a,b;
		let value, depth;
		let numToken;
		switch (ruleName) {
			case "exponentiation":
				a = tokenList[position].value;
				b = tokenList[position+3].value;
				depth = tokenList[position].depth;
				numToken = new Token("number", Math.pow(a,b), depth);
				tokenList.splice(position, 4, numToken);
				break;
			case "implied_multiply":
				a = tokenList[position].value;
				b = tokenList[position+1].value;
				depth = tokenList[position].depth;
				numToken = new Token("number", a*b, depth);
				tokenList.splice(position, 2, numToken);
				break;
			case "single_num":
				numToken = tokenList[position+1];
				numToken.depth -= 1;
				tokenList.splice(position, 3, numToken);
				break;
			case "empty_brackets":
				tokenList.splice(position, 2);
				break;
			case "multiply":
			case "divide":
			case "add_sub":
				a = tokenList[position].value;
				b = tokenList[position+2].value;
				depth = tokenList[position].depth;
				if (ruleName=="multiply") {
					numToken = new Token("number", a*b, depth);
				} else if (ruleName=="divide") {
					numToken = new Token("number", a/b, depth);
				} else if (ruleName=="add_sub") {
					value = (tokenList[position+1].value == "+") ? a+b : a-b
					numToken = new Token("number", value, depth);
				}
				tokenList.splice(position, 3, numToken);
				break;
			default:
				throw `doRule(): Unknown rule "${ruleName}"`
		}
	}
}


// let evaluator = new Evaluator();

// // should evaluate to -814
// let expr = Expression.fromString("1+20-30*4(5+4/2)+5");

// // let expr = Expression.fromString("1+15/5");

// // let expr = new Expression();
// // expr.addToken("number", 10);
// // expr.addToken("operator", "+");
// // expr.addToken("number", 7);
// // expr.addToken("operator", "*");
// // expr.addToken("operator", "(");
// // expr.addToken("number", 4);
// // expr.addToken("operator", "+");
// // expr.addToken("number", 3);
// // expr.addToken("operator", ")");


// let foo;
// foo = expr.toString();
// // console.log(foo);
// expr = Expression.fromString(foo)

// let result;
// result = evaluator.parse(expr);
// console.log(result);

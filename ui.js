"use strict";

function addToDisplay(classList, message) {
	let display = document.getElementById("display");
	let element = document.createElement("div");
	element.setAttribute("class", classList);
	element.textContent = message;
	display.appendChild(element);
}

function scrollToBottom() {
	let display = document.getElementById("display");
	display.scrollTop = display.scrollHeight;
}

function setInput(message) {
	let input = document.getElementById('input');
	input.value = message;
}

function getInput() {
	let input = document.getElementById('input');
	return input.value;
}

function appendToInput(message) {
	let original = getInput();
	setInput(`${original}${message}`);
}

function delCharFromInput() {
	let original = getInput();
	setInput(original.slice(0,original.length-1));
}

// addToDisplay("error", "testing");
// addToDisplay("expression", "1+1");
// addToDisplay("answer", "2");
// addToDisplay("expression", "1+1");
// addToDisplay("answer", "2");
// addToDisplay("expression", "1+20-30*4(5+4/2)+5");
// addToDisplay("answer", "1+1.5");
// addToDisplay("expression", "1+1.5");
// addToDisplay("error", "Error: Unrecognised character \".\"");
// addToDisplay("expression", "1+15/5");
// addToDisplay("answer", "1+1.5");




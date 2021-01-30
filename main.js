"use strict";

function evaluateInput() {
	// get input then clear input
	let input = getInput();
	setInput("");

	addToDisplay("expression", input)
	let expr = Expression.fromString(input);
	if (typeof expr == "string") {
		addToDisplay("error", expr);
	} else {
		let evalulator = new Evaluator();
		let answer = evalulator.parse(expr);
		if (typeof answer == "string") {
			addToDisplay("error", answer);
		} else {
			addToDisplay("answer", answer);
		}
	}
	scrollToBottom();
}

function setupButtons() {
	let container = document.getElementById("buttons_container");
	let buttons = Array.from(container.getElementsByTagName("button"));
	buttons.forEach(processButton);
	function processButton(button) {
		if (button.classList.contains("button_number")) {
			button.addEventListener("click", event=>{
				appendToInput(event.target.innerText);
			});
		} else if (button.classList.contains("button_operator")) {
			button.addEventListener("click", event=>{
				appendToInput(event.target.innerText);
			});
		} else if (button.classList.contains("button_misc")) {
			let func;
			switch (button.innerText) {
				case "AC":
				func = () => setInput("");
				break;
				case "Del":
				func = delCharFromInput
				break;
				case "Eval":
				func = evaluateInput;
				break;
				default:
				throw `Unrecognised button_misc button: ${button.innerText}`
			}
			button.addEventListener("click",func);
		}
	}
}

function setupInput() {
	let input = document.getElementById("input");
	input.addEventListener("keyup", event => {
		if (event.keyCode === 13) {
			event.preventDefault();
			document.getElementById("btn_eval").click();
		}
	})
}

setupButtons();
setupInput();
addToDisplay("expression", "This is a calculator webapp, created as part of the Odin Project.");

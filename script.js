
const currentDisplay = document.getElementById("currentDisplay");
const previousDisplay = document.getElementById("previousDisplay");
const buttons = document.querySelector(".buttons");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

// Calculator variables
let currentValue = "0";
let firstOperand = null;
let operator = null;
let waitingForSecondOperand = false;
let justCalculated = false;

// Load calculation history
let history = JSON.parse(localStorage.getItem("calcHistory")) || [];

// Display the current number
function updateDisplay() {
    currentDisplay.textContent = currentValue;

    if (operator !== null && firstOperand !== null) {
        previousDisplay.textContent =
            firstOperand + " " + operatorSymbol(operator);
    } else {
        previousDisplay.textContent = "";
    }
}

// Convert operator to display symbol
function operatorSymbol(op) {
    if (op === "+") return "+";
    if (op === "-") return "−";
    if (op === "*") return "×";
    if (op === "/") return "÷";
    return op;
}

// Format long decimal results
function formatNumber(number) {
    if (!Number.isFinite(number)) {
        return "Error";
    }

    return String(Number(number.toPrecision(12)));
}

// Enter a number
function inputNumber(number) {
    if (currentValue === "Error") {
        clearCalculator();
    }

    if (waitingForSecondOperand || justCalculated) {
        currentValue = number === "." ? "0." : number;
        waitingForSecondOperand = false;
        justCalculated = false;
        updateDisplay();
        return;
    }

    if (number === "." && currentValue.includes(".")) {
        return;
    }

    if (currentValue === "0" && number !== ".") {
        currentValue = number;
    } else {
        currentValue += number;
    }

    updateDisplay();
}

// Choose an operator
function chooseOperator(nextOperator) {
    if (currentValue === "Error") {
        return;
    }

    const inputValue = Number(currentValue);

    if (operator && !waitingForSecondOperand) {
        const result = calculate(firstOperand, inputValue, operator);

        if (result === null) {
            showError();
            return;
        }

        currentValue = formatNumber(result);
        firstOperand = result;
    } else {
        firstOperand = inputValue;
    }

    operator = nextOperator;
    waitingForSecondOperand = true;
    justCalculated = false;

    updateDisplay();
}

// Perform calculation
function calculate(a, b, op) {
    if (op === "+") return a + b;
    if (op === "-") return a - b;
    if (op === "*") return a * b;

    if (op === "/") {
        if (b === 0) return null;
        return a / b;
    }

    return b;
}

// Equals button
function performCalculation() {
    if (operator === null || waitingForSecondOperand) {
        return;
    }

    const secondOperand = Number(currentValue);
    const expression =
        formatNumber(firstOperand) + " " +
        operatorSymbol(operator) + " " +
        formatNumber(secondOperand);

    const result = calculate(firstOperand, secondOperand, operator);

    if (result === null) {
        showError();
        return;
    }

    currentValue = formatNumber(result);

    addHistory(expression, currentValue);

    firstOperand = null;
    operator = null;
    waitingForSecondOperand = true;
    justCalculated = true;

    updateDisplay();
}

// Clear everything
function clearCalculator() {
    currentValue = "0";
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
    justCalculated = false;

    updateDisplay();
}

// Delete the last digit
function deleteDigit() {
    if (currentValue === "Error") {
        clearCalculator();
        return;
    }

    if (waitingForSecondOperand || justCalculated) {
        return;
    }

    if (currentValue.length <= 1) {
        currentValue = "0";
    } else {
        currentValue = currentValue.slice(0, -1);
    }

    updateDisplay();
}

// Toggle positive / negative
function toggleSign() {
    if (currentValue === "Error" || currentValue === "0") {
        return;
    }

    currentValue = currentValue.startsWith("-")
        ? currentValue.slice(1)
        : "-" + currentValue;

    updateDisplay();
}

// Percentage
function percentage() {
    if (currentValue === "Error") {
        return;
    }

    currentValue = formatNumber(Number(currentValue) / 100);
    waitingForSecondOperand = false;
    justCalculated = false;

    updateDisplay();
}

// Show error
function showError() {
    currentValue = "Error";
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = true;
    justCalculated = true;

    updateDisplay();
}

// Add a calculation to history
function addHistory(expression, result) {
    history.unshift({
        expression: expression,
        result: result
    });

    // Keep only the latest 20 calculations
    history = history.slice(0, 20);

    saveHistory();
    renderHistory();
}

// Save history
function saveHistory() {
    localStorage.setItem("calcHistory", JSON.stringify(history));
}

// Display history
function renderHistory() {
    historyList.replaceChildren();

    if (history.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-history";
        emptyMessage.textContent = "Your calculations will appear here.";
        historyList.appendChild(emptyMessage);
        return;
    }

    history.forEach(item => {
        const historyItem = document.createElement("div");
        historyItem.className = "history-item";

        const expression = document.createElement("div");
        expression.className = "history-expression";
        expression.textContent = item.expression;

        const result = document.createElement("div");
        result.className = "history-result";
        result.textContent = "= " + item.result;

        historyItem.appendChild(expression);
        historyItem.appendChild(result);

        historyList.appendChild(historyItem);
    });
}

// Handle calculator button clicks
buttons.addEventListener("click", function(event) {
    const button = event.target.closest("button");

    if (!button) return;

    if (button.dataset.number !== undefined) {
        inputNumber(button.dataset.number);
        return;
    }

    if (button.dataset.operator) {
        chooseOperator(button.dataset.operator);
        return;
    }

    const action = button.dataset.action;

    if (action === "clear") {
        clearCalculator();
    }

    if (action === "delete") {
        deleteDigit();
    }

    if (action === "sign") {
        toggleSign();
    }

    if (action === "percent") {
        percentage();
    }

    if (action === "equals") {
        performCalculation();
    }
});

// Keyboard support
document.addEventListener("keydown", function(event) {
    const key = event.key;

    if (/^[0-9]$/.test(key)) {
        inputNumber(key);
    }

    if (key === ".") {
        inputNumber(".");
    }

    if (["+", "-", "*", "/"].includes(key)) {
        chooseOperator(key);
    }

    if (key === "Enter" || key === "=") {
        event.preventDefault();
        performCalculation();
    }

    if (key === "Backspace") {
        deleteDigit();
    }

    if (key === "Escape") {
        clearCalculator();
    }

    if (key === "%") {
        percentage();
    }
});

// Clear history
clearHistoryBtn.addEventListener("click", function() {
    history = [];
    saveHistory();
    renderHistory();
});

// Initial display
updateDisplay();
renderHistory();

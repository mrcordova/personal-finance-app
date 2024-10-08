// const dataResponse = await fetch("/api/data");
const dataResponse = await fetch("/backend/data.json");
const data = await dataResponse.json();
console.log(data);
// const URL = "http://localhost:3000";
// const dataResponse = await fetch(`${URL}/api/data`);
// const data = await dataResponse.json();
// console.log(data);
// const transactionsBtn = document.querySelector("#transaction-btn");
// const budgetsBtn = document.querySelector("#budgets-btn");
const controller = new AbortController();
const sidebarMenu = document.getElementById("sidebar-menu");
const minimizeMenu = document.getElementById("mini-menu");
const main = document.querySelector("main");

const config = { attributes: true, childList: true, subtree: true };

const itemsPerPage = 10;
let currentTransactionsPage = 0;
let transactionItems;
let budgetCardItems;
const searchOption = {
  category: "all transactions",
  sortBy: "",
  previousCategory: "all transactions",
  search: "",
};
// const isnum = (val) => /^\d+$/.test(val);
const isNum = (val) => /^\d+[.]*\d*$/.test(val);
// console.log(parseFloat("5"));

const themes = {
  "#82C9D7": "cyan",
  "#277C78": "green",
  "#F2CDAC": "yellow",
  "#626070": "navy",
  "#C94736": "red",
  "#826CB0": "purple",
  "#AF81BA": "pink",
  "#597C7C": "turquoise",
  "#93674F": "brown",
  "#934F6F": "magenta",
  "#3F82B2": "blue",
  "#97A0AC": "navy-grey",
  "#7F9161": "army-green",
  "#CAB361": "gold",
  "#BE6C49": "orange",
  "#FFFFFF": "white",
};
const sortByFuncs = {
  latest: sortByLatest,
  oldest: sortByOldest,
  "a to z": sortByAtoZ,
  "z to a": sortByZtoA,
  highest: sortByHighestAmount,
  lowest: sortByLowestAmount,
};
const transactions = data["transactions"];
const budgets = data["budgets"];
const pots = data["pots"];
const currentMonth = new Date().toLocaleDateString("en-AU", { month: "short" });
// console.log(currentMonth);
let budgetCard;
// console.log(main);
// Initialize the DOM parser
const parser = new DOMParser();

const options = {
  year: "numeric",
  month: "short",
  day: "2-digit",
};

function createDate(date) {
  return new Date(date).toLocaleDateString("en-AU", options);
}

function checkMaxInput(e) {
  // console.log(isNum(e.target.value) && e.target.value != "");
  e.target.classList.toggle("input-error", !isNum(e.target.value));
}
// Parse the text
// const doc = parser.parseFromString(html, "text/html");

//  Templates for sidebar list items
const templates = {
  index: await extractTemplate("index"),
  transactions: await extractTemplate("transactions"),
  budgets: await extractTemplate("budgets"),
  pots: await extractTemplate("pots"),
  recurring: await extractTemplate("recurring"),
};
// console.log(templates);
const callback = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      const mainTransaction = document.querySelector(".main-transactions");
      const mainBudgets = document.querySelector(".main-budgets");
      const mainPots = document.querySelector(".main-pots");
      // console.log(mainPots);
      if (mainTransaction) {
        observer.disconnect();
        transactionsUpdate();
        // console.log(transactionItems);
        updateDisplay();
        const searchInput = main.querySelector("#search-transaction");
        searchInput.addEventListener("input", (e) => {
          const val = e.target.value.toLowerCase();
          searchOption["search"] = val;

          const filteredNames = transactionItems.filter((item) => {
            return item.dataset.name.toLowerCase().startsWith(val);
          });

          currentTransactionsPage = checkRange(
            currentTransactionsPage,
            filteredNames.length
          );

          const paginatedData = paginateData(
            filteredNames,
            currentTransactionsPage
          );

          // console.log(paginatedData);

          const dataSet = new Set(paginatedData);
          const totalPages = Math.ceil(filteredNames.length / itemsPerPage);

          const pageNumberContainer =
            document.querySelector(".page-number-btns");
          pageNumberContainer.replaceChildren();

          for (let index = 0; index < totalPages; index++) {
            // console.log(index);
            pageNumberContainer.insertAdjacentHTML(
              "beforeend",
              `<button  data-nav="" data-page="${index}" >${index + 1}</button>`
            );
          }

          transactionItems.forEach((item, index) => {
            item.classList.toggle("hidden", !dataSet.has(item));
          });

          updateActiveButtonState();
        });
      } else if (mainBudgets) {
        observer.disconnect();

        // console.log(mainBudgets);
        const chartCard = mainBudgets.querySelector(".chart-card");
        const spendingObjs = {};
        const budgetCards = mainBudgets.querySelector(".budget-cards");

        for (const budget of budgets) {
          createBudgetCard(budgetCards, budget);
          const amountSpend = getSpendingAmountForMonth(budget.category);
          const amountSpendToDisplay = Math.abs(amountSpend);

          spendingObjs[themes[budget.theme]] = {
            spending: parseFloat(amountSpendToDisplay),
            max: budget.maximum,
            category: budget.category,
            theme: themes[budget.theme],
          };
        }
        // budgetCardItems = budgetCards;

        // console.log(budgetCardItems);

        const totalSpend = accumalateAmount`${spendingObjs}`;
        const totalLimit = accumalateAmount`limit${spendingObjs}`;
        chartCard.insertAdjacentHTML(
          "afterbegin",
          `
        <div class="budget-chart">
        <div>
          <p class="public-sans-regular">
            <span data-total-spend="${totalSpend}" data-total-limit="${totalLimit}" class="public-sans-bold">$${totalSpend}</span>
            of $${totalLimit} limit
          </p>
        </div>
        </div>
        <div class="chart-summary">
        <h3 class="public-sans-bold">Spending Summary</h3>

        <div class="spending-category-container public-sans-regular">
        ${createCategoryElements`${spendingObjs}`}
       
        </div>
        </div>
        `
        );
        const budgetChart = chartCard.querySelector(".budget-chart");
        const percentage = createChartPercentageObject(spendingObjs);

        const menuValues = main.querySelectorAll(
          '[data-parameter="editBudget"]:has([data-theme])'
        );
        // console.log(menuValues);
        for (const [key, value] of Object.entries(spendingObjs)) {
          const menuItemOne = menuValues[0].querySelector(
            `li:has([data-theme="${value.theme}"])`
          );
          const themeOne = menuItemOne.querySelector("[data-theme]");
          const menuItemTwo = menuValues[1].querySelector(
            `li:has([data-theme="${value.theme}"])`
          );
          const themeTwo = menuItemTwo.querySelector("[data-theme]");

          menuItemOne.setAttribute("data-used", "true");
          menuItemOne.children[0].setAttribute("tabindex", -1);

          // console.log(themeOne);
          themeOne.setAttribute(
            "style",
            `background-color: color-mix( in srgb, var(--${themeOne.dataset.theme}) 100%, var(--white) 100%)`
          );
          themeTwo.setAttribute(
            "style",
            `background-color: color-mix( in srgb, var(--${themeOne.dataset.theme}) 100%, var(--white) 100%)`
          );

          menuItemTwo.setAttribute("data-used", "true");
          menuItemTwo.children[0].setAttribute("tabindex", -1);
        }
        budgetChart.setAttribute(
          "style",
          `background: conic-gradient(at 50% 50% ${returnChartStr`${percentage}`})`
        );

        const newDialog = document.querySelector("#new-budget-dialog");

        const themeBtn = newDialog.querySelector('[data-action="tag"]');
        const maxAmountInputs = main.querySelectorAll(
          '[data-action="max-spending"]'
        );
        const menu = themeBtn.nextElementSibling;
        const availableTheme = menu.querySelector('li[data-used="false"]');

        let prevThemeChoice =
          availableTheme.children[0].children[0].children[0].dataset.theme;

        for (const maxAmountInput of maxAmountInputs) {
          maxAmountInput.addEventListener("input", checkMaxInput);
        }
        // console.log(prevThemeChoice);
        newDialog.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();

          // console.log(prevThemeChoice);
          // console.log("start of new dialog", prevThemeChoice);
          const btnAction = e.target.closest("[data-action]");

          // console.log(e.target);
          // console.log(btnAction);
          if (btnAction) {
            // console.log("============end===============");
            if (btnAction.dataset.action === "close") {
              const maxInput = newDialog.querySelector(
                '[data-action="max-spending"]'
              );
              maxInput.classList.toggle("input-error", false);
              maxInput.value = "";
              // console.log(e.target);
              const menuValues = main.querySelectorAll(
                `li:has([data-theme="${prevThemeChoice}"])`
              );
              // console.log(prevThemeChoice);

              for (const menuValue of menuValues) {
                const theme = menuValue.querySelector("[data-theme]");

                menuValue.setAttribute("data-used", "false");
                menuValue.children[0].setAttribute("tabindex", 0);
                theme.style = "";
              }
              newDialog.close();
            } else if (btnAction.dataset.action === "tag") {
              // console.log(btnAction.children[0].children[0]);
              prevThemeChoice = btnAction.children[0].children[0].dataset.theme;
              btnAction.nextElementSibling.classList.toggle(
                "show-drop-content",
                btnAction.dataset.budgetDialogShow === "true" ? true : false
              );

              btnAction.setAttribute(
                "data-budget-dialog-show",
                btnAction.dataset.budgetDialogShow === "true" ? "false" : "true"
              );

              // budgetDialogEditBtn.nextElementSibling.classList.toggle(
              //   "show-drop-content",
              //   budgetDialogEditBtn.dataset.budgetDialogShow === "true"
              //     ? true
              //     : false
              // );

              // budgetDialogEditBtn.setAttribute(
              //   "data-budget-dialog-show",
              //   budgetDialogEditBtn.dataset.budgetDialogShow === "true"
              //     ? "false"
              //     : "true"
              // );
            } else if (btnAction.dataset.action === "category") {
              btnAction.nextElementSibling.classList.toggle(
                "show-drop-content",
                btnAction.dataset.budgetDialogShow === "true" ? true : false
              );

              btnAction.setAttribute(
                "data-budget-dialog-show",
                btnAction.dataset.budgetDialogShow === "true" ? "false" : "true"
              );
            } else if (btnAction.dataset.action === "value") {
              const mainBtnAction =
                btnAction.parentElement.previousElementSibling.dataset.action;
              if (mainBtnAction === "tag") {
                const newTheme =
                  btnAction.children[0].children[0].children[0].dataset.theme;
                const dropdownBtn = newDialog.querySelector(
                  `[data-action="${btnAction.parentElement.previousElementSibling.dataset.action}"]`
                );
                const oldTheme =
                  dropdownBtn.children[0].children[0].dataset.theme;
                const menuValues = main.querySelectorAll(
                  `li:has([data-theme="${newTheme}"])`
                );

                const oldValues = main.querySelectorAll(
                  `li:has([data-theme="${oldTheme}"])`
                );
                for (const menuValue of oldValues) {
                  const theme = menuValue.querySelector("[data-theme]");

                  menuValue.setAttribute("data-used", "false");
                  menuValue.children[0].setAttribute("tabindex", 0);
                  theme.style = "";
                }

                const btnSpanClone =
                  btnAction.children[0].children[0].cloneNode(true);
                const mainSpan = dropdownBtn.children[0];
                mainSpan.replaceWith(btnSpanClone);

                for (const menuValue of menuValues) {
                  // console.log(menuValue);
                  const theme = menuValue.querySelector("[data-theme]");

                  menuValue.setAttribute("data-used", "true");
                  menuValue.children[0].setAttribute("tabindex", -1);
                  theme.style = `background-color: color-mix( in srgb, var(--${newTheme}) 100%, var(--white) 100%)`;
                }
                prevThemeChoice = newTheme;
                console.log("value clicked");
                btnAction.parentElement.classList.toggle(
                  "show-drop-content",
                  false
                );

                btnAction.parentElement.previousElementSibling.setAttribute(
                  "data-budget-dialog-show",
                  true
                );
              } else if (mainBtnAction === "category") {
                updateCategoryChoice(btnAction);
              }
            } else if (btnAction.dataset.action === "max-spending") {
              // console.log("here");
            } else if (btnAction.dataset.action === "add-budget") {
              const budgetCards = main.querySelector(".budget-cards");
              const totalSpend = main.querySelector(
                ".chart-card [data-total-spend]"
              );
              const spendingSummary = main.querySelector(
                ".chart-card .spending-category-container"
              );

              const actions = newDialog.querySelectorAll(
                '[data-action="category"], [data-action="tag"], [data-action="max-spending"]'
              );

              if (!isNum(actions[1].value)) {
                console.log("error");
                actions[1].classList.toggle("input-error", true);
                return;
              }
              const max = parseFloat(actions[1].value);

              const category = actions[0].children[0].textContent;
              const spendForMonth = Math.abs(
                getSpendingAmountForMonth(category)
              );

              const newTotalSpend =
                parseFloat(totalSpend.dataset.totalSpend) + spendForMonth;

              const newLimit =
                parseFloat(totalSpend.dataset.totalLimit) + parseFloat(max);

              totalSpend.setAttribute("data-total-spend", newTotalSpend);
              totalSpend.textContent = `$${newTotalSpend}`;

              totalSpend.nextSibling.textContent = `of $${newLimit} limit`;
              totalSpend.setAttribute("data-total-limit", newLimit);

              const budgetCardObj = {
                category,
                theme: getKeyByValue(
                  themes,
                  actions[2].children[0].children[0].dataset.theme
                ),
                maximum: max,
              };
              const categorySummartObj = {};

              budgets.push(budgetCardObj);

              categorySummartObj[`${themes[budgetCardObj.theme]}`] = {
                theme: themes[budgetCardObj.theme],
                max: budgetCardObj.maximum,
                spending: spendForMonth,
                category: budgetCardObj.category,
              };

              createBudgetCard(budgetCards, budgetCardObj);
              spendingSummary.insertAdjacentHTML(
                "beforeend",
                createCategoryElements("", categorySummartObj)
              );

              createBudgetChart(budgetChart.nextElementSibling, budgetChart);

              const themeBtn = newDialog.querySelector('[data-action="tag"]');
              const menu = themeBtn.nextElementSibling;
              const availableTheme = menu.querySelector(
                'li[data-used="false"]'
              );

              prevThemeChoice =
                availableTheme.children[0].children[0].children[0].dataset
                  .theme;
              newDialog.close();
            }
          }
        });

        const editDialog = document.querySelector("#edit-budget-dialog");

        editDialog.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          const btnAction = e.target.closest("[data-action]");

          if (btnAction) {
            if (btnAction.dataset.action === "close") {
              const oldChoices = main.querySelectorAll(
                `li:has([data-theme="${budgetCard.dataset.colorTag}"])`
              );

              const tagBtn = editDialog.querySelector("[data-action='tag']");
              const menuValues = main.querySelectorAll(
                `li:has([data-theme="${tagBtn.children[0].children[0].dataset.theme}"])`
              );

              // console.log(menuValues);
              for (const menuValue of menuValues) {
                const theme = menuValue.querySelector("[data-theme]");

                menuValue.setAttribute("data-used", "false");
                menuValue.children[0].setAttribute("tabindex", 0);
                theme.style = "";
              }
              const btnSpanClone =
                oldChoices[0].children[0].children[0].cloneNode(true);
              const mainSpan = tagBtn.children[0];

              // console.log(btnSpanClone);
              mainSpan.replaceWith(btnSpanClone);

              for (const menuValue of oldChoices) {
                const theme = menuValue.querySelector("[data-theme]");

                menuValue.setAttribute("data-used", "true");
                menuValue.children[0].setAttribute("tabindex", -1);
                theme.style = `background-color: color-mix( in srgb, var(--${budgetCard.dataset.colorTag}) 100%, var(--white) 100%)`;
              }

              editDialog.close();
              budgetCard = null;
            } else if (btnAction.dataset.action === "tag") {
              // possibly set prevThemeChoice here
              btnAction.nextElementSibling.classList.toggle(
                "show-drop-content",
                btnAction.dataset.budgetDialogShow === "true" ? true : false
              );

              btnAction.setAttribute(
                "data-budget-dialog-show",
                btnAction.dataset.budgetDialogShow === "true" ? "false" : "true"
              );
            } else if (btnAction.dataset.action === "category") {
              btnAction.nextElementSibling.classList.toggle(
                "show-drop-content",
                btnAction.dataset.budgetDialogShow === "true" ? true : false
              );

              btnAction.setAttribute(
                "data-budget-dialog-show",
                btnAction.dataset.budgetDialogShow === "true" ? "false" : "true"
              );
            } else if (btnAction.dataset.action === "value") {
              const mainBtnAction =
                btnAction.parentElement.previousElementSibling.dataset.action;
              if (mainBtnAction === "tag") {
                // updateThemeChoice(btnAction);
                const newTheme =
                  btnAction.children[0].children[0].children[0].dataset.theme;

                const dropdownBtn = editDialog.querySelector(
                  `[data-action="${btnAction.parentElement.previousElementSibling.dataset.action}"]`
                );
                const oldTheme =
                  dropdownBtn.children[0].children[0].dataset.theme;
                const menuValues = main.querySelectorAll(
                  `li:has([data-theme="${newTheme}"])`
                );

                const oldValues = main.querySelectorAll(
                  `li:has([data-theme="${oldTheme}"])`
                );
                for (const menuValue of oldValues) {
                  const theme = menuValue.querySelector("[data-theme]");

                  menuValue.setAttribute("data-used", "false");
                  menuValue.children[0].setAttribute("tabindex", 0);
                  theme.style = "";
                }

                const btnSpanClone =
                  btnAction.children[0].children[0].cloneNode(true);
                const mainSpan = dropdownBtn.children[0];
                mainSpan.replaceWith(btnSpanClone);

                for (const menuValue of menuValues) {
                  // console.log(menuValue);
                  const theme = menuValue.querySelector("[data-theme]");

                  menuValue.setAttribute("data-used", "true");
                  menuValue.children[0].setAttribute("tabindex", -1);
                  theme.style = `background-color: color-mix( in srgb, var(--${newTheme}) 100%, var(--white) 100%)`;
                }

                btnAction.parentElement.classList.toggle(
                  "show-drop-content",
                  false
                );

                btnAction.parentElement.previousElementSibling.setAttribute(
                  "data-budget-dialog-show",
                  true
                );
              } else if (mainBtnAction === "category") {
                updateCategoryChoice(btnAction);
              }
            } else if (btnAction.dataset.action === "save-budget") {
              const actions = editDialog.querySelectorAll(
                '[data-action="category"], [data-action="tag"], [data-action="max-spending"]'
              );

              const themesEle = budgetCard.querySelectorAll(`[data-theme]`);
              const theme = actions[2].children[0].children[0].dataset.theme;
              const category = actions[0].children[0].textContent;
              const max = parseFloat(actions[1].value).toFixed(2);
              const chart = budgetCard.parentElement.previousElementSibling;
              const budgetChart = chart.children[0];

              const spendingSummary = chart.querySelector(
                `.chart-category:has([data-theme=${budgetCard.dataset.colorTag}])`
              );

              if (!isNum(actions[1].value)) {
                actions[1].classList.toggle("input-error", true);
                return;
              }

              const totalSpend = chart.querySelector("[data-total-spend]");
              const spendForMonth = Math.abs(
                getSpendingAmountForMonth(category)
              );

              const newLimit =
                parseFloat(totalSpend.dataset.totalLimit) -
                parseFloat(budgetCard.dataset.maxAmount) +
                parseFloat(max);

              const newTotalSpend =
                parseFloat(totalSpend.dataset.totalSpend) +
                parseFloat(budgetCard.dataset.spend) +
                spendForMonth;
              const latestSpending = getLatestSpending(category);
              const tbodySpending = budgetCard.querySelector(
                ".latest-spending-table > tbody"
              );

              tbodySpending.replaceChildren();
              tbodySpending.insertAdjacentHTML(
                "beforeend",
                createLatestSpending`${latestSpending}`
              );

              totalSpend.setAttribute("data-total-spend", newTotalSpend);
              totalSpend.setAttribute("data-total-limit", newLimit);
              totalSpend.textContent = `$${newTotalSpend}`;
              totalSpend.nextSibling.textContent = `of $${newLimit} limit`;

              spendingSummary.children[0].setAttribute("data-theme", theme);
              spendingSummary.children[1].textContent = category;
              spendingSummary.children[2].setAttribute(
                "data-spending",
                spendForMonth.toFixed(2)
              );
              spendingSummary.children[2].setAttribute("data-total", max);
              spendingSummary.children[2].childNodes[1].textContent = `$${spendForMonth.toFixed(
                2
              )}`;
              spendingSummary.children[2].childNodes[2].textContent = `\xa0 of $${max}`;

              themesEle[0].setAttribute("data-theme", theme);
              themesEle[0].nextSibling.nodeValue = category;
              themesEle[1].previousElementSibling.children[0].textContent = `$${max}`;
              themesEle[1].previousElementSibling.setAttribute(
                "for",
                `${category}-progress`
              );
              themesEle[1].setAttribute("id", `${category}-progress`);
              themesEle[1].setAttribute("data-theme", theme);
              themesEle[1].setAttribute("max", max);
              themesEle[1].setAttribute("value", spendForMonth);
              themesEle[1].setAttribute(
                "style",
                `--progress-value: var(--${theme})`
              );

              themesEle[2].nextElementSibling.children[1].textContent = `$${spendForMonth}`;
              themesEle[2].setAttribute("data-theme", theme);

              themesEle[3].nextElementSibling.children[1].textContent = `$${Math.max(
                0,
                parseFloat(max) - parseFloat(spendForMonth)
              )}`;

              createBudgetChart(budgetChart.nextElementSibling, budgetChart);

              const oldTheme = getKeyByValue(
                themes,
                budgetCard.dataset.colorTag
              );

              // console.log(budgetCard.dataset.colorTag);
              // console.log(themes);
              // console.log(
              // Object.keys(themes).find((key) => themes[key] === "green")
              // );
              budgets.forEach((budget) => {
                if (budget.theme === oldTheme) {
                  budget.category = category;
                  budget.maximum = parseFloat(max);
                  budget.theme = getKeyByValue(themes, theme);
                }
              });
              // console.log(budgets);

              budgetCard.setAttribute("data-category", category);
              budgetCard.setAttribute("data-max-amount", max);
              budgetCard.setAttribute("data-color-tag", theme);
              budgetCard.setAttribute("data-spend", spendForMonth * -1);

              const themeBtn = newDialog.querySelector('[data-action="tag"]');
              const menu = themeBtn.nextElementSibling;
              const availableTheme = menu.querySelector(
                'li[data-used="false"]'
              );

              prevThemeChoice =
                availableTheme.children[0].children[0].children[0].dataset
                  .theme;
              editDialog.close();
            }
          }
        });

        const deleteDialog = document.querySelector("#delete-budget-dialog");

        deleteDialog.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          const btn = e.target.closest("button");
          const optionDropdown = budgetCard.querySelector(
            "button[data-budget-show]"
          );
          if (btn) {
            const choice = btn.dataset.action;
            // console.log(btn);
            if (choice && choice === "delete") {
              const chartSummary = budgetChart.nextElementSibling.querySelector(
                `div.chart-category:has(> div[data-theme="${budgetCard.dataset.colorTag}"] )`
              );
              const totalSpend =
                budgetChart.querySelector("[data-total-spend]");

              const newLimit =
                parseFloat(totalSpend.dataset.totalLimit) -
                parseFloat(budgetCard.dataset.maxAmount);

              const newTotalSpend =
                parseFloat(totalSpend.dataset.totalSpend) +
                parseFloat(budgetCard.dataset.spend);
              const oldTheme = getKeyByValue(
                themes,
                budgetCard.dataset.colorTag
              );

              totalSpend.setAttribute("data-total-spend", newTotalSpend);
              totalSpend.setAttribute("data-total-limit", newLimit);
              totalSpend.textContent = `$${newTotalSpend}`;
              totalSpend.nextSibling.textContent = `of $${newLimit} limit`;
              chartSummary.remove();
              budgetCard.remove();
              createBudgetChart(budgetChart.nextElementSibling, budgetChart);
              // release theme choices

              const idxOfBudgetCard = budgets
                .map((budget) => budget.theme)
                .indexOf(`${oldTheme}`);

              budgets.splice(idxOfBudgetCard, 1);

              console.log(budgets);

              const oldChoices = main.querySelectorAll(
                `li:has([data-theme="${budgetCard.dataset.colorTag}"])`
              );

              for (const menuValue of oldChoices) {
                const theme = menuValue.querySelector("[data-theme]");

                menuValue.setAttribute("data-used", "false");
                menuValue.children[0].setAttribute("tabindex", 0);
                theme.style = ``;
              }
            }
            deleteDialog.close();
          }
          optionDropdown?.nextElementSibling.classList.toggle(
            "show-drop-content",
            false
          );

          optionDropdown?.setAttribute("data-budget-show", "true");
        });
      } else if (mainPots) {
        // console.log(mainPots);
        observer.disconnect();
        for (const pot of pots) {
          const theme = themes[pot.theme];
          mainPots.insertAdjacentHTML(
            "beforeend",
            `   <div
        data-category="${pot.name}"
        data-spend="${pot.total}"
        data-max-amount="${pot.target}"
        data-color-tag="${theme}"
        class="pot-card category-card public-sans-regular">
        <div class="theme-container">
          <div class="theme-title public-sans-bold">
            <div data-theme="${theme}" class="theme-circle"></div>
           ${pot.name}
          </div>
          <div class="dropdown">
            <button data-budget-show="true">
              <img src="./assets/images/icon-ellipsis.svg" alt="ellipsis" />
            </button>

            <menu data-parameter="editPot" class="dropdown-content">
              <li><button data-action="edit">Edit Pot</button></li>
              <li><button data-action="delete">Delete Pot</button></li>
            </menu>
          </div>
        </div>
        <div class="pot-progress-container">
          <label for="${pot.name}-progress">
            Total Saved
            <span class="public-sans-bold pot-total">$${pot.total}</span>
          </label>
          <div class="pot-progress-info-container">
            <progress
              data-theme="${theme}"
              max="${pot.target}"
              value="${pot.total}"
              id="${pot.name}-progress"
              style="--progress-value: var(--${theme})">
              ${pot.target}
            </progress>

            <div class="pot-numbers-container">
              <p class="pot-numbers public-sans-bold">${(
                (pot.total / pot.target) *
                100
              ).toFixed(2)}%</p>

              <p class="pot-numbers">
                Target of
                <span>$${pot.target}</span>
              </p>
            </div>
          </div>
        </div>

        <div class="money-btns-container">
          <button class="latest-spending-container public-sans-bold">
            + Add Money
          </button>

          <button class="latest-spending-container public-sans-bold">
            Withdraw
          </button>
        </div>
       </div>`
          );
        }
        // Pots eventlisteners
        const newDialog = document.querySelector("#new-budget-dialog");
        newDialog.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          console.log(e.target);
        });
      }
    } else if (mutation.type === "attribures") {
      console.log(`the ${mutation.attributeName} attribute was modified.`);
    }
  }
};

const observer = new MutationObserver(callback);
observer.observe(main, config);

// helper function for retrieving templates from html
async function extractTemplate(id) {
  return parser
    .parseFromString(await (await fetch(`./${id}.html`)).text(), "text/html")
    .querySelector(`#${id}-template`);
}

function createChartPercentageObject(obj) {
  const totalSpending = accumalateAmount("", obj);

  let percentage = [];
  let idx = 0;
  for (const [key, value] of Object.entries(obj)) {
    const end = (value.spending / totalSpending) * 100;

    if (percentage.length === 0) {
      percentage.push({
        category: key,
        values: { start: 0, end },
        theme: value.theme,
      });
    } else {
      const start = percentage[idx].values.end;
      percentage.push({
        category: key,
        values: { start: start, end: start + end },
        theme: value.theme,
      });
      idx++;
    }
  }
  return percentage;
}

function createBudgetCard(budgetCards, budget) {
  const amountSpend = getSpendingAmountForMonth(budget.category);
  const amountSpendToDisplay = Math.abs(amountSpend);

  const latestSpending = getLatestSpending(budget.category);

  budgetCards.insertAdjacentHTML(
    "beforeend",
    `<div
        data-category="${
          budget.category
        }" data-spend="${amountSpend}" data-max-amount="${budget.maximum.toFixed(
      2
    )}" data-color-tag="${themes[budget.theme]}"
        class="budget-card category-card public-sans-regular">
        <div class="theme-container">
          <div class="theme-title public-sans-bold">
            <div data-theme="${
              themes[budget.theme]
            }" class="theme-circle"></div>
            ${budget.category}
          </div>
          <div class="dropdown"  >
            <button data-budget-show="true">
              <img src="./assets/images/icon-ellipsis.svg" alt="ellipsis" />
            </button>

            <menu data-parameter="editBudget" class="dropdown-content">
              <li><button data-action="edit">Edit Budget</button></li>
              <li><button data-action="delete">Delete Budget</button></li>
            </menu>
          </div>
        </div>
        <div class="budget-progress-container">
          <label for="${budget.category}-progress">
            Maximum of
            <span>$${budget.maximum.toFixed(2)}</span>
          </label>
          <progress
            data-theme="${themes[budget.theme]}"
            max="${budget.maximum}"
            value="${amountSpendToDisplay}"
            id="${budget.category}-progress"
            style="--progress-value: var(--${themes[budget.theme]})">
            ${budget.maximum}
          </progress>

          <div class="budget-numbers-container">
            <div data-theme="${themes[budget.theme]}"></div>
            <div class="budget-numbers">
              <p>Spent</p>
              <span class="public-sans-bold">$${amountSpendToDisplay}</span>
            </div>
            <div data-theme></div>
            <div class="budget-numbers">
              <p>Remaining</p>
              <span class="public-sans-bold">$${Math.max(
                budget.maximum + amountSpend,
                0
              )}</span>
            </div>
          </div>
        </div>

        <div class="latest-spending-container">
          <div class="latest-spending-header">
            <h3 class="public-sans-bold">Latest Spending</h3>
            <button data-action="see-all">
              <span>See All</span>
              <img
                src="./assets/images/icon-caret-right.svg"
                alt="caret right" />
            </button>
          </div>

          <table class="latest-spending-table">
            <tbody>
             ${createLatestSpending([""], latestSpending)}
             </tbody>
          </table>
        </div>
      </div>`
  );
}

function createLatestSpending(strings, latestSpendingArray) {
  let finalStr = "";
  for (const latestSpending of latestSpendingArray) {
    finalStr += `<tr>
                <td>
                  <div class="table-name">
                    <img
                      loading="lazy"
                      src="${latestSpending.avatar}"
                      alt="${latestSpending.name}" />
                    <p class="public-sans-bold">${latestSpending.name}</p>
                  </div>
                </td>
                <td>
                  <div class="spending-info">
                    <p class="spending-amount public-sans-bold">${latestSpending.strAmount}</p>
                    <p class="speding-date">${latestSpending.date}</p>
                  </div>
                </td>
              </tr>
             `;
  }
  return finalStr;
}
function createCategoryElements(strings, obj) {
  let finalStr = "";

  for (const [key, value] of Object.entries(obj)) {
    const title = value.category;
    // console.log(title);
    const { theme, max, spending } = value;
    finalStr += `
          <div class="chart-category">
            <div data-theme=${theme}></div>
            <p>${title}</p>
            <p data-spending="${spending.toFixed(2)}" data-total="${max}">
              <span class="public-sans-bold">$${spending.toFixed(2)}</span>
              &ThickSpace; of $${max.toFixed(2)}
            </p>
          </div>
         `;
  }
  return finalStr;
}
function accumalateAmount(strings, obj) {
  let spendingTotal = 0;

  for (const [key, value] of Object.entries(obj)) {
    if (strings[0] !== "limit") {
      spendingTotal += value.spending;
    } else {
      spendingTotal += value.max;
    }
  }
  return spendingTotal;
}

function returnChartStr(strings, percentage) {
  let finalStr = "";
  for (const element of percentage) {
    const theme = element.theme;
    const values = element.values;
    finalStr += `, var(--${theme}) ${values.start}%, var(--${theme}) ${values.end}%`;
  }
  return finalStr;
}
function transactionsUpdate() {
  const transactionsTable = main.querySelector("table > tbody");

  for (const transaction of transactions) {
    const date = createDate(transaction.date);
    let amount = String(transaction.amount);
    let amountTemp = transaction.amount.toFixed(2);
    const pos = amountTemp.indexOf("-") == -1 ? 0 : 1;
    let temp =
      (pos == 0 ? "+" : "") +
      amountTemp.substring(0, pos) +
      "$" +
      amountTemp.substring(pos);
    // console.log(temp);
    transactionsTable.insertAdjacentHTML(
      "beforeend",
      `  <tr data-category="${transaction.category}" data-name="${
        transaction.name
      }" data-max-spending="${transaction.amount}" data-date="${
        transaction.date
      }">
          <th colspan="1" role="row">
            <img
              class="profile-pic"
              src="${transaction.avatar}"
              alt="${transaction.name}" />
            <p class="sender-desktop public-sans-bold title">${
              transaction.name
            }</p>
          </th>
          <td colspan="1">
            <p class="mobile-name public-sans-bold title">${
              transaction.name
            }</p>
            <p  >${transaction.category}</p>
          </td>

          <td colspan="1" class="sender-desktop">${date}</td>
          <td colspan="1">
            <p class="public-sans-bold title ${
              amount.includes("-") ? "" : "positive"
            }">${temp}</p>
            <p class="mobile-name">${date}</p>
          </td>
        </tr>`
    );
  }
  // recieve transaction rows
  transactionItems = Array.from(transactionsTable.getElementsByTagName("tr"));

  // console.log(mutation);
  createPageButtons();
  updateActiveButtonState();
  showPage(currentTransactionsPage);
}
// console.log(templates);
function showPage(page) {
  const startIdx = page * itemsPerPage;

  const endIdx = startIdx + itemsPerPage;

  // console.log(arr);
  transactionItems.forEach((item, index) => {
    item.classList.toggle("hidden", index < startIdx || index >= endIdx);
  });
}

function createPageButtons() {
  const totalPages = Math.ceil(transactionItems.length / itemsPerPage);

  const pageNumberContainer = document.querySelector(".page-number-btns");
  // console.log(pageNumberContainer);

  // const paginationContainer = document.cre
  for (let index = 0; index < totalPages; index++) {
    // console.log(index);
    pageNumberContainer.insertAdjacentHTML(
      "beforeend",
      `<button  data-nav="" data-page="${index}" >${index + 1}</button>`
    );
  }
}

function filterData(data) {
  return data.filter((item) => {
    return (
      (item.dataset.category.toLowerCase() ===
        searchOption.category.toLowerCase() ||
        searchOption.category.toLowerCase() === "all transactions" ||
        searchOption.category === "") &&
      item.dataset.name.toLowerCase().startsWith(searchOption.search)
    );
  });
}

function paginateData(data, currentPage) {
  const startIdx = currentPage * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  return data.slice(startIdx, endIdx);
}
// TODO: budgets
function getSpendingAmountForMonth(category) {
  let amountSpent = 0;
  for (const transaction of transactions) {
    const date = new Date(transaction.date).toLocaleDateString("en-AU", {
      month: "short",
    });

    if (
      transaction.category.toLowerCase() === category.toLowerCase() &&
      date === "Aug" &&
      transaction.amount < 0
    ) {
      amountSpent += transaction.amount;
    }
  }
  return amountSpent;
}

function getLatestSpending(category) {
  let lastThreeTransactions = [];
  for (let index = 0; index < transactions.length; index++) {
    const element = transactions[index];
    if (element.category === category && element.amount < 0) {
      const strAmount = String(element.amount.toFixed(2));
      const pos = strAmount.indexOf("-") == -1 ? 0 : 1;
      let temp =
        (pos == 0 ? "+" : "") +
        strAmount.substring(0, pos) +
        "$" +
        strAmount.substring(pos);
      lastThreeTransactions.push({
        name: element.name,
        strAmount: temp,
        amount: element.amount,
        date: createDate(element.date),
        avatar: element.avatar,
      });
    }
  }
  // console.log(lastThreeTransactions);
  return lastThreeTransactions.slice(0, 3);
}

function updateDisplay() {
  // console.log(transactionItems);
  const filteredData = filterData(transactionItems);
  // console.log(
  //   searchOption.category.toLowerCase() ===
  //     searchOption.previousCategory.toLowerCase()
  // );
  currentTransactionsPage = checkRange(
    searchOption.category.toLowerCase() ===
      searchOption.previousCategory.toLowerCase()
      ? currentTransactionsPage
      : 0,
    filteredData.length
  );
  searchOption["previousCategory"] = searchOption["category"];
  const paginatedData = paginateData(filteredData, currentTransactionsPage);

  // console.log(paginatedData);

  const dataSet = new Set(paginatedData);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const pageNumberContainer = document.querySelector(".page-number-btns");
  pageNumberContainer.replaceChildren();

  for (let index = 0; index < totalPages; index++) {
    // console.log(index);
    pageNumberContainer.insertAdjacentHTML(
      "beforeend",
      `<button  data-nav="" data-page="${index}" >${index + 1}</button>`
    );
  }

  transactionItems.forEach((item, index) => {
    item.classList.toggle("hidden", !dataSet.has(item));
  });

  updateActiveButtonState();
}

function updateActiveButtonState() {
  const pageButtons = document.querySelectorAll("button[data-page]");
  pageButtons.forEach((btn, idx) => {
    btn.classList.toggle("active", idx === currentTransactionsPage);
    btn.nextElementSibling?.classList.toggle(
      "ellipse",
      btn.classList.contains("active")
    );
  });
}

function checkRange(number, max) {
  let n = Number(number);
  n = Math.min(Math.ceil(max / itemsPerPage) - 1, Math.max(0, n));
  return n;
}

function sortByAtoZ(a, b) {
  return a.dataset.name.localeCompare(b.dataset.name);
}
function sortByZtoA(a, b) {
  return b.dataset.name.localeCompare(a.dataset.name);
}
function sortByLowestAmount(a, b) {
  return a.dataset.amount - b.dataset.amount;
}
function sortByHighestAmount(a, b) {
  return b.dataset.amount - a.dataset.amount;
}
function sortByLatest(a, b) {
  const bDate = b.dataset.date.substring(0, b.dataset.date.indexOf("T"));
  const aDate = a.dataset.date.substring(0, a.dataset.date.indexOf("T"));

  if (aDate == bDate) {
    return b.dataset.date < a.dataset.date;
  }
  return b.dataset.date > a.dataset.date
    ? 1
    : b.dataset.date < a.dataset.date
    ? -1
    : 0;
}
function sortByOldest(a, b) {
  const bDate = b.dataset.date.substring(0, b.dataset.date.indexOf("T"));
  const aDate = a.dataset.date.substring(0, a.dataset.date.indexOf("T"));

  if (aDate == bDate) {
    return a.dataset.date < b.dataset.date;
  }
  return a.dataset.date > b.dataset.date
    ? 1
    : a.dataset.date < b.dataset.date
    ? -1
    : 0;
}
function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}
function updateThemeChoice(btnAction) {
  // console.log(btnAction.parentElement.previousElementSibling);
  const dropdownBtns = main.querySelectorAll(
    `[data-action="${btnAction.parentElement.previousElementSibling.dataset.action}"]`
  );

  for (const dropdownBtn of dropdownBtns) {
    // console.log(btnAction);
    const menu = dropdownBtn.nextElementSibling;
    const btnSpanClone = btnAction.children[0].children[0].cloneNode(true);
    const mainSpan = dropdownBtn.children[0];
    const oldTheme = mainSpan.children[0].dataset.theme;
    const newTheme = btnSpanClone.children[0].dataset.theme;
    const newLiChoice = menu.querySelector(
      `li:has([data-theme="${newTheme}"])`
    );
    const oldLiChoice = menu.querySelector(
      `li:has([data-theme="${oldTheme}"])`
    );

    // console.log(btnSpanClone);
    btnSpanClone.children[0].style = "";

    mainSpan.replaceWith(btnSpanClone);

    //get old li and make it clickable again
    oldLiChoice.setAttribute("data-used", "false");
    oldLiChoice.children[0].setAttribute("tabindex", 0);
    oldLiChoice.children[0].children[0].children[0].style = "";

    newLiChoice.setAttribute("data-used", "true");
    newLiChoice.children[0].setAttribute("tabindex", -1);
    newLiChoice.children[0].children[0].children[0].style = `background-color: color-mix( in srgb, var(--${newTheme}) 100%, var(--white) 100%)`;

    // console.log(newLiChoice);
  }
  btnAction.parentElement.classList.toggle("show-drop-content", false);

  btnAction.parentElement.previousElementSibling.setAttribute(
    "data-budget-dialog-show",
    true
  );
}
function createThemeChoice(btnAction) {
  // const menu = btnAction.parentElement;

  const btnSpanClone = btnAction.children[0].children[0].cloneNode(true);
  const mainSpan = btnAction.parentElement.previousElementSibling.children[0];
  // const oldTheme = mainSpan.children[0].dataset.theme;
  const newTheme = btnSpanClone.children[0].dataset.theme;

  mainSpan.replaceWith(btnSpanClone);

  // const oldLiChoice = menu.querySelector(`li:has([data-theme="${oldTheme}"])`);
  // oldLiChoice.setAttribute("data-used", "false");
  // oldLiChoice.children[0].setAttribute("tabindex", 0);

  // oldLiChoice.children[0].children[0].children[0].style = "";

  btnAction.setAttribute("data-used", "true");
  btnAction.children[0].setAttribute("tabindex", -1);
  btnAction.children[0].children[0].children[0].style = `background-color: color-mix( in srgb, var(--${newTheme}) 100%, var(--white) 100%)`;

  btnAction.parentElement.classList.toggle("show-drop-content", false);

  btnAction.parentElement.previousElementSibling.setAttribute(
    "data-budget-dialog-show",
    true
  );
}
function updateCategoryChoice(btnAction) {
  const btnSpanClone = btnAction.children[0].children[0].cloneNode(true);
  const mainSpan = btnAction.parentElement.previousElementSibling.children[0];

  mainSpan.replaceWith(btnSpanClone);

  btnAction.parentElement.classList.toggle("show-drop-content", false);

  btnAction.parentElement.previousElementSibling.setAttribute(
    "data-budget-dialog-show",
    true
  );
}

function createBudgetChart(chart, budgetChart) {
  // console.log(chart.children);
  const spendingCategoryEles = chart.children[1].children;
  const spendingObjs = {};
  // console.log(spendingCategoryEles);
  for (const spendingEle of spendingCategoryEles) {
    spendingObjs[spendingEle.children[0].dataset.theme] = {
      category: spendingEle.children[1].textContent,
      theme: spendingEle.children[0].dataset.theme,
      spending: parseFloat(spendingEle.children[2].dataset.spending),
      max: parseFloat(spendingEle.children[2].dataset.total),
    };
  }

  const percentage = createChartPercentageObject(spendingObjs);

  budgetChart.setAttribute(
    "style",
    `background: conic-gradient(at 50% 50% ${returnChartStr`${percentage}`})`
  );
}
// change template when sidebar list item is clikcked
sidebarMenu.addEventListener("click", async (e) => {
  const liEle = e.target.closest("li");
  if (liEle) {
    const currentActiveLiEle = document.querySelector("li.checked");
    currentActiveLiEle.classList.remove("checked");
    liEle.classList.add("checked");
    observer.observe(main, config);
    const clone = templates[`${liEle.dataset.menu}`].content.cloneNode(true);
    main.replaceChildren(clone);
  }
});

minimizeMenu.addEventListener("click", (e) => {
  const nav = e.target.closest("nav");
  const spans = nav.querySelectorAll("span");
  const logo = nav.children[0];

  logo.setAttribute(
    "src",
    logo.getAttribute("src").includes("large")
      ? "./assets/images/logo-small.svg"
      : "./assets/images/logo-large.svg"
  );

  for (const span of spans) {
    if (span.style.display == "") {
      span.style.display = "none";
    } else {
      span.style.display = "";
    }
  }
});

main.addEventListener("click", async (e) => {
  const pageButton = e.target.closest("button[data-nav]");
  const filterParameter = e.target.closest("menu");
  const newBudgetBtn = e.target.closest("button[data-action='new']");
  const budgetEditBtn = e.target.closest("button[data-budget-show]");
  const budgetDialogEditBtn = e.target.closest(
    "button[data-budget-dialog-show]"
  );

  const seeAllBtn = e.target.closest("button[data-action='see-all'");
  // console.log(seeAllBtn);

  if (pageButton) {
    currentTransactionsPage =
      pageButton.dataset.page != undefined
        ? pageButton.dataset.page
        : (currentTransactionsPage += parseInt(pageButton.dataset.move));

    currentTransactionsPage = checkRange(
      currentTransactionsPage,
      transactionItems.length
    );

    updateDisplay();
  } else if (filterParameter) {
    const btn = e.target.closest("li")?.children[0];

    if (btn && filterParameter.dataset.parameter !== "editBudget") {
      const previousChoice = filterParameter.querySelector(".public-sans-bold");

      previousChoice?.classList.remove("public-sans-bold");
      btn.parentElement.classList.add("public-sans-bold");
    }

    if (filterParameter.dataset.parameter === "category") {
      const categoryBtn = main.querySelector("button#category-btn");
      searchOption["previousCategory"] =
        filterParameter.previousElementSibling.childNodes[0].textContent
          .trim()
          .toLowerCase();
      searchOption[filterParameter.dataset.parameter] = btn.textContent;

      categoryBtn.childNodes[0].textContent = btn.textContent;
      updateDisplay();
    } else if (filterParameter.dataset.parameter === "sortBy") {
      const transactionsTable = main.querySelector("table > tbody");
      const sortByBtn = main.querySelector("button#sort-by-btn");
      transactionItems.sort(sortByFuncs[btn.textContent.toLowerCase()]);

      transactionsTable.replaceChildren(...transactionItems);

      searchOption[filterParameter.dataset.parameter] = btn.textContent;
      sortByBtn.childNodes[0].textContent = btn.textContent;
      updateDisplay();
    } else if (filterParameter.dataset.parameter === "editBudget") {
      if (btn && btn.dataset.action === "delete") {
        const deleteDialog = document.querySelector("#delete-budget-dialog");
        const dialogCateTitle = deleteDialog.querySelector("[data-category]");

        dialogCateTitle.textContent = budgetCard.dataset.category.trim();
        // console.log("here");
        deleteDialog.showModal();
      } else if (btn && btn.dataset.action === "edit") {
        const editDialog = document.querySelector("#edit-budget-dialog");
        const optionDropdown = budgetCard.querySelector(
          "button[data-budget-show]"
        );

        const actions = editDialog.querySelectorAll(
          '[data-action="category"], [data-action="tag"], [data-action="max-spending"]'
        );

        actions[0].children[0].textContent = budgetCard.dataset.category;
        actions[1].value = budgetCard.dataset.maxAmount;

        actions[1].classList.toggle("input-error", false);

        const dropdownBtn = actions[2];

        // console.log(actions[2]);
        const newTheme = budgetCard.dataset.colorTag;
        const menuValues = main.querySelectorAll(
          `li:has([data-theme="${newTheme}"])`
        );

        menuValues[0].setAttribute("data-used", "false");
        menuValues[0].children[0].setAttribute("tabindex", 0);
        menuValues[0].children[0].children[0].children[0].style = ``;
        const btnSpanClone =
          menuValues[0].children[0].children[0].cloneNode(true);
        // console.log(btnSpanClone);
        const mainSpan = dropdownBtn.children[0];
        mainSpan.replaceWith(btnSpanClone);

        for (const menuValue of menuValues) {
          const theme = menuValue.querySelector("[data-theme]");

          menuValue.setAttribute("data-used", "true");
          menuValue.children[0].setAttribute("tabindex", -1);
          theme.style = `background-color: color-mix( in srgb, var(--${newTheme}) 100%, var(--white) 100%)`;
        }
        editDialog.showModal();

        e.preventDefault();

        optionDropdown?.nextElementSibling.classList.toggle(
          "show-drop-content",
          false
        );

        optionDropdown?.setAttribute("data-budget-show", "true");
      }
    } else if (filterParameter.dataset.parameter === "editPot") {
      if (btn && btn.dataset.action === "delete") {
        const deleteDialog = document.querySelector("#delete-budget-dialog");
        const dialogCateTitle = deleteDialog.querySelector("[data-category]");

        dialogCateTitle.textContent = budgetCard.dataset.category.trim();
        // console.log("here");
        deleteDialog.showModal();
      } else if (btn && btn.dataset.action === "edit") {
        const editDialog = document.querySelector("#edit-pot-dialog");
        const optionDropdown = budgetCard.querySelector(
          "button[data-budget-show]"
        );

        const actions = editDialog.querySelectorAll(
          '[data-action="category"], [data-action="tag"], [data-action="max-spending"]'
        );

        actions[0].children[0].value = budgetCard.dataset.category;
        actions[1].value = budgetCard.dataset.maxAmount;

        actions[1].classList.toggle("input-error", false);

        const dropdownBtn = actions[2];

        // console.log(actions[2]);
        const newTheme = budgetCard.dataset.colorTag;
        const menuValues = main.querySelectorAll(
          `li:has([data-theme="${newTheme}"])`
        );

        menuValues[0].setAttribute("data-used", "false");
        menuValues[0].children[0].setAttribute("tabindex", 0);
        menuValues[0].children[0].children[0].children[0].style = ``;
        const btnSpanClone =
          menuValues[0].children[0].children[0].cloneNode(true);
        // console.log(btnSpanClone);
        const mainSpan = dropdownBtn.children[0];
        mainSpan.replaceWith(btnSpanClone);

        for (const menuValue of menuValues) {
          const theme = menuValue.querySelector("[data-theme]");

          menuValue.setAttribute("data-used", "true");
          menuValue.children[0].setAttribute("tabindex", -1);
          theme.style = `background-color: color-mix( in srgb, var(--${newTheme}) 100%, var(--white) 100%)`;
        }
        editDialog.showModal();

        e.preventDefault();

        optionDropdown?.nextElementSibling.classList.toggle(
          "show-drop-content",
          false
        );

        optionDropdown?.setAttribute("data-budget-show", "true");
      }
    }
  } else if (newBudgetBtn) {
    e.preventDefault();
    const newDialog = document.querySelector("#new-budget-dialog");
    newDialog.showModal();

    const themeBtn = newDialog.querySelector('[data-action="tag"]');
    const menu = themeBtn.nextElementSibling;
    const availableTheme = menu.querySelector('li[data-used="false"]');
    const prevThemeChoice =
      availableTheme.children[0].children[0].children[0].dataset.theme;
    const menuValues = main.querySelectorAll(
      `li:has([data-theme="${prevThemeChoice}"])`
    );
    const replaceTagValue =
      menuValues[0].children[0].children[0].cloneNode(true);

    for (const menuValue of menuValues) {
      const theme = menuValue.querySelector("[data-theme]");

      menuValue.setAttribute("data-used", "true");
      menuValue.children[0].setAttribute("tabindex", -1);
      theme.setAttribute(
        "style",
        `background-color: color-mix( in srgb, var(--${theme.dataset.theme}) 100%, var(--white) 100%)`
      );
    }
    themeBtn.children[0].replaceWith(replaceTagValue);

    // console.log("here");
  } else if (budgetEditBtn) {
    budgetCard = budgetEditBtn.closest("[data-category]");
    // console.log(budgetCard);

    budgetEditBtn.nextElementSibling.classList.toggle(
      "show-drop-content",
      budgetEditBtn.dataset.budgetShow === "true" ? true : false
    );

    budgetEditBtn.setAttribute(
      "data-budget-show",
      budgetEditBtn.dataset.budgetShow === "true" ? "false" : "true"
    );
  } else if (budgetDialogEditBtn) {
    // console.log(budgetDialogEditBtn);
    budgetDialogEditBtn.nextElementSibling.classList.toggle(
      "show-drop-content",
      budgetDialogEditBtn.dataset.budgetDialogShow === "true" ? true : false
    );

    budgetDialogEditBtn.setAttribute(
      "data-budget-dialog-show",
      budgetDialogEditBtn.dataset.budgetDialogShow === "true" ? "false" : "true"
    );
  } else if (seeAllBtn) {
    const category = seeAllBtn.closest("div[data-category]").dataset.category;
    const liEle = document.querySelector("[data-menu='transactions']");
    const currentActiveLiEle = document.querySelector("li[data-menu].checked");
    currentActiveLiEle.classList.remove("checked");
    liEle.classList.add("checked");
    searchOption.category = category;
    observer.observe(main, config);
    const clone = templates[`${liEle.dataset.menu}`].content.cloneNode(true);
    main.replaceChildren(clone);

    // updateDisplay();
    console.log(searchOption.category);
    // console.log(category);
  }
});

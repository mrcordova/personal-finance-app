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
const sidebarMenu = document.getElementById("sidebar-menu");
const minimizeMenu = document.getElementById("mini-menu");
const main = document.querySelector("main");

const config = { attributes: true, childList: true, subtree: true };

const itemsPerPage = 10;
let currentTransactionsPage = 0;
let transactionItems;
const searchOption = {
  category: "all transactions",
  sortBy: "",
  previousCategory: "all transactions",
  search: "",
};

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
      if (mainTransaction) {
        observer.disconnect();
        transactionsUpdate();
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

          spendingObjs[budget.category] = {
            spending: parseFloat(amountSpendToDisplay),
            max: budget.maximum,
            theme: themes[budget.theme],
          };
        }

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

        // const menuValues = main.querySelector('[data-parameter="editBudget"')
        // for (const [key, value] of Object.entries(spendingObjs)) {

        // }
        budgetChart.setAttribute(
          "style",
          `background: conic-gradient(at 50% 50% ${returnChartStr`${percentage}`})`
        );
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
            <button>
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
    const title = key;
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

main.addEventListener("click", (e) => {
  const pageButton = e.target.closest("button[data-nav]");
  const filterParameter = e.target.closest("menu");
  const newBudgetBtn = e.target.closest("button[data-action='new']");
  const budgetEditBtn = e.target.closest("button[data-budget-show]");
  const budgetDialogEditBtn = e.target.closest(
    "button[data-budget-dialog-show]"
  );

  // console.log(e.target);
  // e.preventDefault();
  // console.log(budgetEditBtn);
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
    // console.log(e.target);
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
        deleteDialog.showModal();

        deleteDialog.addEventListener("click", (e) => {
          const btn = e.target.closest("button");
          const optionDropdown = budgetCard.querySelector(
            "button[data-budget-show]"
          );
          const choice = btn.dataset.action;
          if (choice === "delete") {
            budgetCard.remove();
          }
          optionDropdown?.nextElementSibling.classList.toggle(
            "show-drop-content",
            false
          );

          optionDropdown?.setAttribute("data-budget-show", "true");
          deleteDialog.close();
        });
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
        actions[2].children[0].children[0].setAttribute(
          "data-theme",
          budgetCard.dataset.colorTag
        );

        actions[2].children[0].childNodes[2].textContent =
          budgetCard.dataset.colorTag;

        editDialog.showModal();

        e.preventDefault();

        editDialog.addEventListener("click", (e) => {
          e.preventDefault();
          const btnAction = e.target.closest("[data-action]");

          if (btnAction) {
            if (btnAction.dataset.action === "close") {
              editDialog.close();
              budgetCard = null;
            } else if (btnAction.dataset.action === "value") {
              let dummy = document.createElement("span");
              btnAction.parentElement.previousElementSibling.children[0].after(
                dummy
              );

              btnAction.children[0].children[0].after(
                btnAction.parentElement.previousElementSibling.children[0]
              );

              dummy.replaceWith(btnAction.children[0].children[0]);

              if (e.target.tagName !== "SPAN") {
                btnAction.parentElement.classList.toggle(
                  "show-drop-content",
                  false
                );

                btnAction.parentElement.previousElementSibling.setAttribute(
                  "data-budget-dialog-show",
                  true
                );
              }
            } else if (btnAction.dataset.action === "save-budget") {
              // e.preventDefault();
              const themes = budgetCard.querySelectorAll(`[data-theme]`);
              const theme = actions[2].children[0].children[0].dataset.theme;
              const category = actions[0].children[0].textContent;
              const max = parseFloat(actions[1].value).toFixed(2);
              const chart = budgetCard.parentElement.previousElementSibling;
              const budgetChart = chart.children[0];
              const spendingCategoryEles = chart.children[1].querySelector(
                ".spending-category-container"
              ).children;
              const spendingSummary = chart.querySelector(
                `.chart-category:has([data-theme=${budgetCard.dataset.colorTag}])`
              );

              const totalSpend = chart.querySelector("[data-total-spend]");
              const spendForMonth = Math.abs(
                getSpendingAmountForMonth(category)
              );

              const spendingObjs = {};
              const newLimit =
                parseFloat(totalSpend.dataset.totalLimit) -
                parseFloat(budgetCard.dataset.maxAmount) +
                parseFloat(max);

              // console.log(totalSpend.dataset);
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

              // console.log(spendingCategoryEles);

              // console.log(spendingObjs);

              // budgetChart.setAttribute(
              //   "style",
              //   `background: conic-gradient(at 50% 50% ${returnChartStr`${percentage}`})`
              // );

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

              themes[0].setAttribute("data-theme", theme);
              themes[0].nextSibling.nodeValue = category;
              themes[1].previousElementSibling.children[0].textContent = `$${max}`;
              themes[1].previousElementSibling.setAttribute(
                "for",
                `${category}-progress`
              );
              themes[1].setAttribute("id", `${category}-progress`);
              themes[1].setAttribute("data-theme", theme);
              themes[1].setAttribute("max", max);
              themes[1].setAttribute("value", spendForMonth);
              themes[1].setAttribute(
                "style",
                `--progress-value: var(--${theme})`
              );

              themes[2].nextElementSibling.children[1].textContent = `$${spendForMonth}`;
              themes[2].setAttribute("data-theme", theme);

              // console.log(max + parseFloat(budgetCard.dataset.spend));
              themes[3].nextElementSibling.children[1].textContent = `$${Math.max(
                0,
                parseFloat(max) - parseFloat(spendForMonth)
              )}`;

              for (const spendingEle of spendingCategoryEles) {
                //  spendingObjs[budget.category] = {
                //    spending: parseFloat(amountSpendToDisplay),
                //    max: budget.maximum,
                //    theme: themes[budget.theme],
                //  };
                // console.log(spendingEle.children[1].textContent);
                spendingObjs[spendingEle.children[1].textContent] = {
                  theme: spendingEle.children[0].dataset.theme,
                  spending: parseFloat(
                    spendingEle.children[2].dataset.spending
                  ),
                  max: parseFloat(spendingEle.children[2].dataset.total),
                };
              }
              // console.log(spendingObjs);
              // const totalSpend = accumalateAmount`${spendingObjs}`;

              const percentage = createChartPercentageObject(spendingObjs);

              // console.log(percentage);
              budgetChart.setAttribute(
                "style",
                `background: conic-gradient(at 50% 50% ${returnChartStr`${percentage}`})`
              );

              // console.log(spendingObjs);

              budgetCard.setAttribute("data-category", category);
              budgetCard.setAttribute("data-max-amount", max);
              budgetCard.setAttribute("data-color-tag", theme);
              budgetCard.setAttribute("data-spend", spendForMonth * -1);
              // budgetCard.setAttribute('data-category', category);

              editDialog.close();
            }
          }
        });
        // console.log(optionDropdown);

        optionDropdown?.nextElementSibling.classList.toggle(
          "show-drop-content",
          false
        );

        optionDropdown?.setAttribute("data-budget-show", "true");
      }
    }
  } else if (newBudgetBtn) {
    const newDialog = document.querySelector("#new-budget-dialog");
    newDialog.showModal();

    newDialog.addEventListener("click", (e) => {
      e.preventDefault();
      // console.log(e.target);
      const btnAction = e.target.closest("[data-action]");

      if (btnAction) {
        if (btnAction.dataset.action === "close") {
          newDialog.close();
          budgetCard = null;
          // dropdownBtn = null;
        } else if (btnAction.dataset.action === "value") {
          let dummy = document.createElement("span");
          btnAction.parentElement.previousElementSibling.children[0].after(
            dummy
          );

          btnAction.children[0].children[0].after(
            btnAction.parentElement.previousElementSibling.children[0]
          );

          dummy.replaceWith(btnAction.children[0].children[0]);

          if (e.target.tagName !== "SPAN") {
            btnAction.parentElement.classList.toggle(
              "show-drop-content",
              false
            );

            // dropdownBtn.setAttribute("data-budget-dialog-show", true);
            btnAction.parentElement.previousElementSibling.setAttribute(
              "data-budget-dialog-show",
              true
            );
          }
        } else if (btnAction.dataset.action === "add-budget") {
          const budgetCards = main.querySelector(".budget-cards");
          const totalSpend = main.querySelector(
            ".chart-card [data-total-spend]"
          );
          const spendingSummary = main.querySelector(
            ".chart-card .spending-category-container"
          );

          // console.log(spendingSummary);
          const actions = newDialog.querySelectorAll(
            '[data-action="category"], [data-action="tag"], [data-action="max-spending"]'
          );

          const category = actions[0].children[0].textContent;
          const spendForMonth = Math.abs(getSpendingAmountForMonth(category));
          // const budgetChart = chart.children[0];

          // console.log(totalSpend.dataset);
          const newTotalSpend =
            parseFloat(totalSpend.dataset.totalSpend) + spendForMonth;
          const max = parseFloat(actions[1].value);
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

          categorySummartObj[`${budgetCardObj.category}`] = {
            theme: themes[budgetCardObj.theme],
            max: budgetCardObj.maximum,
            spending: spendForMonth,
          };

          // console.log(categorySummartObj);
          createBudgetCard(budgetCards, budgetCardObj);
          spendingSummary.insertAdjacentHTML(
            "beforeend",
            createCategoryElements("", categorySummartObj)
          );
          newDialog.close();
        }
      }
    });
  } else if (budgetEditBtn) {
    // console.log(budgetEditBtn);
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
    console.log(budgetDialogEditBtn);
    budgetDialogEditBtn.nextElementSibling.classList.toggle(
      "show-drop-content",
      budgetDialogEditBtn.dataset.budgetDialogShow === "true" ? true : false
    );

    budgetDialogEditBtn.setAttribute(
      "data-budget-dialog-show",
      budgetDialogEditBtn.dataset.budgetDialogShow === "true" ? "false" : "true"
    );
  }
});

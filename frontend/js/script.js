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
};
const transactions = data["transactions"];

// console.log(main);
// Initialize the DOM parser
const parser = new DOMParser();

const options = {
  year: "numeric",
  month: "long",
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
      const ele = document.querySelector(".main-transactions");
      if (ele?.classList.contains("main-transactions")) {
        // console.log("here");
        observer.disconnect();
        transactionsUpdate();
      }

      // console.log(transactionItems);
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
      `  <tr data-category="${transaction.category}">
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
      item.dataset.category.toLowerCase() ===
        searchOption.category.toLowerCase() ||
      searchOption.category.toLowerCase() === "all transactions" ||
      searchOption.category === ""
    );
  });
}

function paginateData(data, currentPage) {
  const startIdx = currentPage * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  return data.slice(startIdx, endIdx);
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

  // console.log(paginatedData);

  const pageNumberContainer = document.querySelector(".page-number-btns");
  pageNumberContainer.replaceChildren();

  for (let index = 0; index < totalPages; index++) {
    // console.log(index);
    pageNumberContainer.insertAdjacentHTML(
      "beforeend",
      `<button  data-nav="" data-page="${index}" >${index + 1}</button>`
    );
  }

  // const startIdx = currentTransactionsPage * itemsPerPage;

  // const endIdx = startIdx + itemsPerPage;

  // console.log(arr);
  transactionItems.forEach((item, index) => {
    item.classList.toggle("hidden", !dataSet.has(item));
  });

  // currentTransactionsPage = 0;
  // console.log(Math.ceil(currentTransactionsPage / itemsPerPage) - 1);

  // console.log(currentTransactionsPage);
  // console.log(filteredData);
  // console.log(paginatedData);
  updateActiveButtonState();
  // console.log(dataSet);/

  // update the display with paginateData
}

function updateActiveButtonState() {
  const pageButtons = document.querySelectorAll("button[data-page]");
  pageButtons.forEach((btn, idx) => {
    // if (idx === currentTransactionsPage) {
    //   btn.classList.add("active");
    // } else {
    //   btn.classList.remove("active");
    // }
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

// function filterTransaction() {
//   transactionItems.forEach((item, index) => {
//     item.classList.toggle(
//       "hidden",
//       item.dataset.category.toLowerCase() !==
//         searchOption.category.toLowerCase()
//     );
//   });
// }
// change template when sidebar list item is clikcked
sidebarMenu.addEventListener("click", async (e) => {
  const liEle = e.target.closest("li");
  // console.log(e.target);
  if (liEle) {
    // console.log(liEle);
    const currentActiveLiEle = document.querySelector("li.checked");
    currentActiveLiEle.classList.remove("checked");
    liEle.classList.add("checked");
    // console.log(templates[`${liEle.dataset.menu}`]);
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
  // console.log(e.target);
  const pageButton = e.target.closest("button[data-nav]");
  const filterParameter = e.target.closest("menu");
  // console.log(filterCategory);

  if (pageButton) {
    currentTransactionsPage =
      pageButton.dataset.page != undefined
        ? pageButton.dataset.page
        : (currentTransactionsPage += parseInt(pageButton.dataset.move));

    currentTransactionsPage = checkRange(
      currentTransactionsPage,
      transactionItems.length
    );
    // console.log(searchOption);
    // console.log(currentTransactionsPage);
    // showPage(currentTransactionsPage);
    // updateActiveButtonState();
    updateDisplay();
  } else if (filterParameter) {
    const btn = e.target.closest("li").children[0];
    const previousChoice = filterParameter.querySelector(".public-sans-bold");
    // console.log(previousChoice);
    previousChoice.classList.remove("public-sans-bold");
    btn.parentElement.classList.add("public-sans-bold");

    if (filterParameter.dataset.parameter === "category") {
      searchOption["previousCategory"] =
        filterParameter.previousElementSibling.childNodes[0].textContent
          .trim()
          .toLowerCase();
    }

    console.log(searchOption);
    searchOption[filterParameter.dataset.parameter] = btn.textContent;
    filterParameter.previousElementSibling.childNodes[0].textContent =
      btn.textContent;
    // filterTransaction();
    updateDisplay();
  }
});

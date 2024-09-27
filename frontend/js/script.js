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
const main = document.querySelector("main");

const config = { attributes: true, childList: true, subtree: true };

const itemsPerPage = 10;
let currentTransactionsPage = 0;
let transactionItems;
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
      `  <tr>
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
            <p>${transaction.category}</p>
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

function checkRange(number) {
  let n = Number(number);
  n = Math.min(
    Math.ceil(transactionItems.length / itemsPerPage) - 1,
    Math.max(0, n)
  );
  return n;
}
// change template when sidebar list item is clikcked
sidebarMenu.addEventListener("click", async (e) => {
  const liEle = e.target.closest("li");
  if (liEle) {
    observer.observe(main, config);
    const clone = templates[`${liEle.dataset.menu}`].content.cloneNode(true);
    main.replaceChildren(clone);
  }
});

main.addEventListener("click", (e) => {
  // console.log(e.target);
  const pageButton = e.target.closest("button[data-nav]");
  // console.log(pageButton);
  if (pageButton) {
    currentTransactionsPage =
      pageButton.dataset.page != undefined
        ? pageButton.dataset.page
        : (currentTransactionsPage += parseInt(pageButton.dataset.move));

    // console.log(Math.ceil(transactionItems.length / itemsPerPage));
    currentTransactionsPage = checkRange(currentTransactionsPage);
    // console.log(currentTransactionsPage);
    showPage(currentTransactionsPage);
    updateActiveButtonState();
  }
});

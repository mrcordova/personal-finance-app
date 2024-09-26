// const dataResponse = await fetch("/api/data");
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
// console.log(main);
// Initialize the DOM parser
const parser = new DOMParser();

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
      if (
        ele?.classList.contains("main-transactions") &&
        !mutation.target.classList.contains("page-number-btns")
      ) {
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
  // recieve transaction rows
  transactionItems = Array.from(
    main.querySelector("table").getElementsByTagName("tr")
  ).slice(1);
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

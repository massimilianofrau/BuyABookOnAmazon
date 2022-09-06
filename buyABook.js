const playwright = require("playwright");
const prompts    = require('prompts');

let genres = [];
let books = [];

async function fetchGenres() {
  console.log("> Fetching genres...")
  const browser = await playwright.chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto("https://www.goodreads.com/choiceawards/best-books-2020");

  genres = await page.$$eval("div.category", (allGenres) => {
    const data = [];
    allGenres.forEach((genre) => {
      const title = genre.querySelector(".category__copy").innerText;
      const value = genre.querySelector("a").href;
      data.push({title, value});
    });
    return data;
  });

  await browser.close();

  askGenre();
}

async function askGenre() {
  const questions = [
    {
      type   : 'select',
      name   : 'genre',
      message: 'Please choose your favourite genre',
      choices: genres,
      initial: 0
    }
  ];

  const response = await prompts(questions);

  randomBook(response.genre)
}

async function randomBook(url) {
  console.log("> Fetching books...")
  
  const browser = await playwright.chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto(url);

  books = await page.$$eval(
    "div.inlineblock.pollAnswer.resultShown",
    (allBooks) => {
      const data = [];
      allBooks.forEach((book) => {
        const name = book.querySelector("img").alt;
        data.push(name);
      });
      return data;
    }
  );

  const randomBookIndex = Math.floor(Math.random() * books.length);
  console.log(`I think you will enjoy the following book: ${books[randomBookIndex]}`);

  await browser.close();

  addBookToAmazonChart(books[randomBookIndex]);
}

async function addBookToAmazonChart(book) {
  const browser = await playwright.chromium.launch({
    headless: false,
  });

  const page = await browser.newPage();
  await page.goto("https://amazon.com/");
  await page.locator('#searchDropdownBox').selectOption({label: 'Books'});
  //await page.waitForTimeout(1000);
  await page.locator('#twotabsearchtextbox').fill(book);
  await page.locator('#nav-search-submit-button').click();
  await page.locator('s-product-image-container a').click();
  await page.locator('#add-to-cart-button').click();
  await page.locator('#nav-cart').click();


  //await browser.close();
}

fetchGenres();

/*try {
  await page.locator('.foo').waitFor();
} catch (e) {
  if (e instanceof playwright.errors.TimeoutError) {
    // Do something if this is a timeout.
  }
}*/

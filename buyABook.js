const playwright = require("playwright");
const prompt = require('prompt');

let genres = [];

async function fetchGenres() {
  const browser = await playwright.chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto("https://www.goodreads.com/choiceawards/best-books-2020");

  genres = await page.$$eval("div.category", (allGenres) => {
    const data = [];
    allGenres.forEach((genre) => {
      const name = genre.querySelector(".category__copy").innerText;
      const url = genre.querySelector("a").href;
      data.push({ name, url });
    });
    return data;
  });

  await browser.close();

  askGenre();
}

function askGenre() {
  const properties = [
    {
      name: 'genre',
      type: 'number',
      message: 'Please entere the genre number',
      conform: function (value) {
        value = Number(value);
        return Number.isInteger(value) && value > 0 && value <= genres.length;
      },
      warning: `Please write a number between 1 and ${genres.length}.`
    }
  ];

  console.log('Hi');
  console.log('%c Can you tell me your favourite book genre?', 'font-weight: bold; color: green;')

  genres.forEach((genre, index) => console.log(`${index + 1} - ${genre.name}`));
  
  console.log('Please entere the genre number.')
  
  prompt.start();
  
  prompt.get(properties, function (err, result) {
    if (err) {
      console.log(err);
      return;
    }
    console.log(`You choosed '${genres[result.genre - 1].name}'`);
    randomBook(genres[result.genre - 1].url)
  });
}

async function randomBook(url) {
  const browser = await playwright.chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto(url);
  
  const books = await page.$$eval(
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
  console.log(`I think you will enjoy the following book: '${books[randomBookIndex]}'`);
  
  await browser.close();
  
  addBookToAmazonChart(books[randomBookIndex]);
}

async function addBookToAmazonChart(book) {
  const browser = await playwright.chromium.launch({
    headless: false,
  });

  const page = await browser.newPage();
  await page.goto("https://amazon.com/");
  await page.locator('#searchDropdownBox').selectOption({ label: 'Books' });
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

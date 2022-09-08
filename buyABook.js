const playwright = require("playwright");
const prompts    = require('prompts');

/** Class to add to amazon cart a random book choosing favourite book genre. */
class BuyABook {
  constructor() {
    this.genres           = [];
    this.books            = [];
    this.selectedGenreUrl = '';
    this.randomBookIndex  = null;

    this._fetchGenres();
  }

  /** Fetch of all book genres. */
  async _fetchGenres() {
    console.log("> Fetching book genres from https://www.goodreads.com/choiceawards/best-books-2020...");

    const browser = await playwright.chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();

    try {
      await page.goto("https://www.goodreads.com/choiceawards/best-books-2020");
    } catch (e) {
      console.error(`Error: ${e}`)
      await browser.close();
      return;
    }

    this.genres = await page.$$eval("div.category", (allGenres) => {
      const data = [];
      allGenres.forEach((genre) => {
        const title = genre.querySelector(".category__copy").innerText;
        const value = genre.querySelector("a").href;
        data.push({title, value});
      });
      return data;
    });

    await browser.close();

    this._askGenre();
  }

  /** Dialog with prompt to let the user choose the favourite genre. */
  async _askGenre() {
    if (this.genres.length === 0) {
      console.error('Error: No genres to choose from.')
      return;
    }

    const questions = [
      {
        type   : 'select',
        name   : 'genre',
        message: 'Please choose your favourite book genre',
        choices: this.genres,
        initial: 0
      }
    ];

    const response = await prompts(questions);

    this.selectedGenreUrl = response.genre;

    this._randomBook(this.selectedGenreUrl);
  }

  /** Fetch a random book.
   * @param {string} url - The URL to fetch from.
   * */
  async _randomBook(url) {
    if (!url && !this.selectedGenreUrl) {
      console.error('Error: Cannot choose a book.')
      return;
    }

    console.log(`> Choosing a book from ${url}...`)

    const browser = await playwright.chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();

    try {
      await page.goto(url);
    } catch (e) {
      console.error(`Error: ${e}`)
      await browser.close();
      return;
    }

    this.books = await page.$$eval(
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

    this.randomBookIndex = Math.floor(Math.random() * this.books.length);
    console.log(`I think you will enjoy this book: ${this.books[this.randomBookIndex]}`);

    await browser.close();

    this._addBookToAmazonCart(this.books[this.randomBookIndex]);
  }

  /** Searches for the book in amazon and add it to the cart.
   * @param {string} book - The name of the book and its author.
   * */
  async _addBookToAmazonCart(book) {
    const browser = await playwright.chromium.launch({
      headless: false,
    });

    const page = await browser.newPage();
    try {
      await page.goto("https://amazon.com/");
    } catch (e) {
      console.error(`Error: ${e}`)
      await browser.close();
      return;
    }
    await page.locator('#searchDropdownBox').selectOption({label: 'Books'});
    //await page.waitForTimeout(1000);
    await page.locator('#twotabsearchtextbox').fill(book);
    await page.locator('#nav-search-submit-button').click();
    await page.locator('[data-component-type="s-product-image"] a').first().click();
    try {
      await page.locator('#add-to-cart-button').click();
    } catch (e) {
      if (e instanceof playwright.errors.TimeoutError) {
        console.error(`It's not possible to add the book to the cart, let's try with another book`)
        await browser.close();
        this._randomBook(this.selectedGenreUrl);
        return;
      }
      await browser.close();
      return;
    }
    await page.locator('[name="proceedToRetailCheckout"]').click();

    console.log('Now you can proceed to checkout.')
  }
}

new BuyABook();
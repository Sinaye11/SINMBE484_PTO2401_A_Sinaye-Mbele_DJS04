// book-preview.js
import { authors, books, BOOKS_PER_PAGE } from './data.js';

// Utility Functions
const createElement = (tag, className, attributes = {}, innerHTML = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    element.innerHTML = innerHTML;
    return element;
};

/**
 * Updates the theme colors based on the provided theme.
 */
const updateTheme = (theme) => {
    if (theme === 'night') {
        document.documentElement.style.setProperty('--color-dark', '255, 255, 255');
        document.documentElement.style.setProperty('--color-light', '10, 10, 20');
    } else {
        document.documentElement.style.setProperty('--color-dark', '10, 10, 20');
        document.documentElement.style.setProperty('--color-light', '255, 255, 255');
    }
};

/**
 * Creating dropdown options from provided data.
 */
const createOptions = (data, defaultOptionText) => {
    const fragment = document.createDocumentFragment();
    const firstElement = createElement('option', '', { value: 'any' }, defaultOptionText);
    fragment.appendChild(firstElement);
    for (const [id, name] of Object.entries(data)) {
        const option = createElement('option', '', { value: id }, name);
        fragment.appendChild(option);
    }
    return fragment;
};

/**
 * Updating the show more button based on the current state.
 */
const updateButton = (button, disabled, remaining) => {
    button.disabled = disabled;
    button.innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${remaining > 0 ? remaining : 0})</span>
    `;
};

/**
 * Rendering a list of books into the specified container.
 */
const renderBooks = (booksList, container) => {
    const fragment = document.createDocumentFragment();
    for (const { author, id, image, title } of booksList) {
        const element = createElement('button', 'preview__item', { 'data-preview': id }, `
            <img class="preview__image" src="${image}" />
            <div class="preview__info">
                <h3 class="preview__title">${title}</h3>
                <div class="preview__author">${authors[author]}</div>
            </div>
        `);
        fragment.appendChild(element);
    }
    container.innerHTML = '';
    container.appendChild(fragment);
};

// BookPreview Class
class BookPreview extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.page = 1;
        this.matches = books;
    }

    connectedCallback() {
        this.render();
        this.init();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: Arial, sans-serif;
                    --color-dark: #0a0a14;
                    --color-light: #fff;
                }
                :host([theme='night']) {
                    --color-dark: #fff;
                    --color-light: #0a0a14;
                }
                :host([theme='day']) {
                    --color-dark: #0a0a14;
                    --color-light: #fff;
                }
                .preview {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                .preview__item {
                    border: 1px solid var(--color-dark);
                    border-radius: 8px;
                    overflow: hidden;
                    width: calc(33.333% - 16px);
                    cursor: pointer;
                }
                .preview__image {
                    width: 30%;
                    height: auto;
                }
                .preview__info {
                    padding: 8px;
                }
                .preview__title {
                    font-size: 1.1em;
                    margin: 0;
                }
                .preview__author {
                    color: gray;
                }
                .list__button {
                    display: inline-block;
                    padding: 10px 20px;
                    border: none;
                    background: #007bff;
                    color: white;
                    border-radius: 5px;
                    cursor: pointer;
                }
                .list__button[disabled] {
                    background: gray;
                }
                .list__message {
                    display: none;
                    color: red;
                }
                .list__message_show {
                    display: block;
                }
            </style>
            <div class="preview" id="preview-list"></div>
            <button class="list__button" id="load-more">Show more</button>
            <div class="list__message" id="list-message">No books found</div>
        `;
    }

    // Initialization
    init() {
        const previewList = this.shadowRoot.querySelector('#preview-list');
        const loadMoreButton = this.shadowRoot.querySelector('#load-more');

        // Render initial books
        renderBooks(this.matches.slice(0, BOOKS_PER_PAGE), previewList);
        this.updateButton();

        loadMoreButton.addEventListener('click', () => this.loadMoreBooks());
        previewList.addEventListener('click', (event) => this.handleBookClick(event));

        // Setting the initial theme
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setAttribute('theme', prefersDarkMode ? 'night' : 'day');
        updateTheme(prefersDarkMode ? 'night' : 'day');

        // Event Listeners
        document.querySelector('[data-settings-form]').addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const { theme } = Object.fromEntries(formData);
            this.setAttribute('theme', theme);
            updateTheme(theme);
            document.querySelector('[data-settings-overlay]').open = false;
        });

        document.querySelector('[data-search-form]').addEventListener('submit', (event) => this.handleSearch(event));
        document.querySelector('[data-list-close]').addEventListener('click', () => document.querySelector('[data-list-active]').open = false);

        document.querySelector('[data-search-cancel]').addEventListener('click', () => document.querySelector('[data-search-overlay]').open = false);
        document.querySelector('[data-settings-cancel]').addEventListener('click', () => document.querySelector('[data-settings-overlay]').open = false);
        document.querySelector('[data-header-search]').addEventListener('click', () => {
            document.querySelector('[data-search-overlay]').open = true;
            document.querySelector('[data-search-title]').focus();
        });
        document.querySelector('[data-header-settings]').addEventListener('click', () => document.querySelector('[data-settings-overlay]').open = true);
    }
    //Render books preview
    renderBooks(booksList) {
        const container = this.shadowRoot.querySelector('#preview-list');
        renderBooks(booksList, container);
    }

    // Update button
    updateButton() {
        const remainingBooks = this.matches.length - (this.page * BOOKS_PER_PAGE);
        const button = this.shadowRoot.querySelector('#load-more');
        updateButton(button, remainingBooks < 1, remainingBooks);
    }

    /**
 * Allows us to load more books and update the view accordingly.
 */
    loadMoreBooks() {
        const start = this.page * BOOKS_PER_PAGE;
        const end = (this.page + 1) * BOOKS_PER_PAGE;
        this.renderBooks(this.matches.slice(start, end));
        this.page += 1;
        this.updateButton();
    }

    /**
 * Handles click events on book elements to show detailed view.
 */
    handleBookClick(event) {
        const pathArray = Array.from(event.path || event.composedPath());
        const clickedElement = pathArray.find(node => node?.dataset?.preview);
        if (clickedElement) {
            const activeBook = books.find(book => book.id === clickedElement.dataset.preview);
            if (activeBook) {
                document.querySelector('[data-list-active]').open = true;
                document.querySelector('[data-list-blur]').src = activeBook.image;
                document.querySelector('[data-list-image]').src = activeBook.image;
                document.querySelector('[data-list-title]').innerText = activeBook.title;
                document.querySelector('[data-list-subtitle]').innerText = `${authors[activeBook.author]} (${new Date(activeBook.published).getFullYear()})`;
                document.querySelector('[data-list-description]').innerText = activeBook.description;
            }
        }
    }
/**
 * Handles search form submission, applies filters, and updates book list.
 */
    handleSearch(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const filters = Object.fromEntries(formData);
        this.matches = books.filter(book => {
            const genreMatch = filters.genre === 'any' || book.genres.includes(filters.genre);
            return (filters.title.trim() === '' || book.title.toLowerCase().includes(filters.title.toLowerCase())) &&
                   (filters.author === 'any' || book.author === filters.author) &&
                   genreMatch;
        });
        this.page = 1;
        this.renderBooks(this.matches.slice(0, BOOKS_PER_PAGE));
        this.updateButton();
        this.shadowRoot.querySelector('#list-message').classList.toggle('list__message_show', this.matches.length < 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.querySelector('[data-search-overlay]').open = false;
    }

    static get observedAttributes() {
        return ['theme'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'theme' && oldValue !== newValue) {
            this.shadowRoot.host.setAttribute('theme', newValue);
            updateTheme(newValue);
        }
    }
}

customElements.define('book-preview', BookPreview);

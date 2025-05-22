import { getNextColumnId, incrementNextColumnId } from './app.js';
import { setupDropZone } from './dragdrop.js';
import { addCard } from './cards.js';
import { saveBoardData, updateCardCounts } from './app.js';

export function addColumn(title = `Column ${getNextColumnId()}`) {
    const board = document.getElementById('board');
    const columnId = `column-${getNextColumnId()}`;
    incrementNextColumnId();
    
    const column = document.createElement('div');
    column.className = 'column';
    column.id = columnId;

    column.innerHTML = `
        <div class="column-header">
            <div class="column-title" data-column-id="${columnId}">${title}</div>
            <span class="card-count">(0)</span>
            <button class="delete-column-btn" data-column-id="${columnId}">✕</button>
        </div>
        <button class="add-card-btn" data-column-id="${columnId}">+ Add a card</button>
        <div class="cards-container" data-column-id="${columnId}"></div>
    `;

    board.appendChild(column);
    setupColumnEvents(columnId);
    saveBoardData();
    return columnId;
}

export function setupColumnEvents(columnId) {
    const column = document.getElementById(columnId);
    if (!column) return;
    
    const columnTitle = column.querySelector('.column-title');
    const deleteColumnBtn = column.querySelector('.delete-column-btn');
    const addCardBtn = column.querySelector('.add-card-btn');
    const cardsContainer = column.querySelector('.cards-container');

    setupDropZone(cardsContainer);
    
    columnTitle.addEventListener('click', () => {
        const currentTitle = columnTitle.textContent;
        const parentElement = columnTitle.parentElement;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'column-title-input';
        input.value = currentTitle;
        
        columnTitle.textContent = '';
        columnTitle.appendChild(input);
        
        input.focus();
        input.select();

        const finishRenaming = () => {
            if (input.parentNode) {
                const newTitle = input.value.trim() || currentTitle;
                columnTitle.textContent = newTitle;
                saveBoardData();
            }
        };

        input.addEventListener('blur', finishRenaming);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            }
        });
    });

    deleteColumnBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this column and all its cards?')) {
            column.remove();
            updateCardCounts();
            saveBoardData();
        }
    });

    addCardBtn.addEventListener('click', () => {
        addCard(columnId);
    });
}

export function updateColumn(columnId, title) {
    const column = document.getElementById(columnId);
    if (column) {
        const titleElement = column.querySelector('.column-title');
        if (titleElement) {
            titleElement.textContent = title;
            saveBoardData();
        }
    }
}

export function deleteColumn(columnId) {
    const column = document.getElementById(columnId);
    if (column) {
        column.remove();
        updateCardCounts();
        saveBoardData();
    }
}
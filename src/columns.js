import { getNextColumnId, incrementNextColumnId } from './app.js';
import { setupDropZone } from './dragdrop.js';
import { addCard } from './cards.js';
import { saveBoardData, updateCardCounts } from './app.js';

// Function to add a new column
export function addColumn(title = `Column ${getNextColumnId()}`) {
    const board = document.getElementById('board');
    const columnId = `column-${getNextColumnId()}`;
    incrementNextColumnId();  // Increment after using the current value
    
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

    // Add event listeners for the new column
    setupColumnEvents(columnId);
    
    // Save board data
    saveBoardData();

    return columnId;
}

// Function to setup event listeners for a column
export function setupColumnEvents(columnId) {
    const column = document.getElementById(columnId);
    const columnTitle = column.querySelector('.column-title');
    const deleteColumnBtn = column.querySelector('.delete-column-btn');
    const addCardBtn = column.querySelector('.add-card-btn');
    const cardsContainer = column.querySelector('.cards-container');

    // Setup drop zone for this column's cards container
    setupDropZone(cardsContainer);

    // Event listener for column title (rename)
    columnTitle.addEventListener('click', () => {
        const currentTitle = columnTitle.textContent;
        columnTitle.innerHTML = `<input type="text" class="column-title-input" value="${currentTitle}">`;
        
        const input = columnTitle.querySelector('.column-title-input');
        input.focus();
        input.select();

        input.addEventListener('blur', finishRenaming);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                finishRenaming();
            }
        });

        function finishRenaming() {
            const newTitle = input.value.trim() || currentTitle;
            columnTitle.textContent = newTitle;
            saveBoardData();
        }
    });

    // Event listener for delete column button
    deleteColumnBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this column and all its cards?')) {
            column.remove();
            updateCardCounts();
            saveBoardData();
        }
    });

    // Event listener for add card button
    addCardBtn.addEventListener('click', () => {
        addCard(columnId);
    });
}

export function setupColumnListeners() {
    // This function can be empty for now since we're setting up column events when each column is created
    console.log("Column listeners initialized");
}
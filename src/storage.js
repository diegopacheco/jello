import { getNextColumnId, setNextColumnId } from './app.js';
import { addColumn } from './columns.js';
import { addCard, sortCardsByVotes } from './cards.js';
import { updateCardCounts } from './counter.js';

// Function to save board data to localStorage
export function saveBoardData() {
    const columns = document.querySelectorAll('.column');
    const boardData = [];

    columns.forEach(column => {
        const columnId = column.id;
        const columnTitle = column.querySelector('.column-title').textContent;
        const cards = [];

        column.querySelectorAll('.card').forEach(card => {
            const cardContent = card.querySelector('.card-content')?.textContent;
            if (cardContent) {
                const upvotes = parseInt(card.querySelector('.upvote-count')?.textContent || "0");
                const downvotes = parseInt(card.querySelector('.downvote-count')?.textContent || "0");
                
                cards.push({
                    text: cardContent,
                    upvotes: upvotes,
                    downvotes: downvotes
                });
            }
        });

        boardData.push({
            id: columnId,
            title: columnTitle,
            cards: cards
        });
    });

    localStorage.setItem('jelloBoard', JSON.stringify(boardData));
    localStorage.setItem('jelloNextColumnId', getNextColumnId());
}

// Function to load board data from localStorage
export function loadBoardData() {
    const savedData = localStorage.getItem('jelloBoard');
    const savedNextId = localStorage.getItem('jelloNextColumnId');

    if (savedNextId) {
        setNextColumnId(savedNextId);
    }

    if (savedData) {
        const boardData = JSON.parse(savedData);
        
        boardData.forEach(column => {
            const columnId = addColumn(column.title);
            
            column.cards.forEach(cardContent => {
                addCard(columnId, cardContent);
            });
            
            // Sort cards by votes after loading
            sortCardsByVotes(columnId);
        });
        
        updateCardCounts();
    } else {
        // Add a default column if no data exists
        addColumn('To Do');
    }
}
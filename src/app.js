import { updateCardCounts } from './counter.js';
import { loadBoardData, saveBoardData } from './storage.js';

// Private variable for the module
let _nextColumnId = 1;

export function getNextColumnId() {
    return _nextColumnId;
}
export function incrementNextColumnId() {
    return _nextColumnId++;
}
export function setNextColumnId(value) {
    _nextColumnId = parseInt(value);
}

export function setupBoard() {
    const board = document.getElementById('board');
    const addColumnBtn = document.getElementById('add-column-btn');
    
    // Load existing data
    loadBoardData();
    
    // Add event listener for adding new columns
    addColumnBtn.addEventListener('click', () => {
        const { addColumn } = require('./columns.js');
        addColumn();
    });
}

export { 
    updateCardCounts,
    saveBoardData
};
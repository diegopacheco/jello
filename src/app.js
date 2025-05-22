import { updateCardCounts } from './counter.js';
import { loadBoardData, saveBoardData } from './storage.js';
import { addColumn } from './columns.js';
import { setupImportFunctionality } from './import.js';

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
    
    setupImportFunctionality();
    loadBoardData();
    addColumnBtn.addEventListener('click', () => {
        addColumn();
    });
}

export { 
    updateCardCounts,
    saveBoardData
};
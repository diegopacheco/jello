import { saveBoardData, updateCardCounts } from './app.js';
import { sortCardsByVotes } from './cards.js';

export function setupDraggable(element) {
    element.setAttribute('draggable', 'true');
    
    element.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', element.id);
        element.classList.add('dragging');
        
        // Disable pointer events on card content while dragging to prevent issues
        const cardContent = element.querySelector('.card-content');
        if (cardContent) {
            cardContent.style.pointerEvents = 'none';
        }
    });
    
    element.addEventListener('dragend', () => {
        element.classList.remove('dragging');
        
        // Re-enable pointer events
        const cardContent = element.querySelector('.card-content');
        if (cardContent) {
            cardContent.style.pointerEvents = 'auto';
        }
        
        updateCardCounts();
        saveBoardData();
    });
}

export function setupDropZone(element) {
    element.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const afterElement = getDragAfterElement(element, e.clientY);
        const draggable = document.querySelector('.dragging');
        
        if (draggable && afterElement == null) {
            element.appendChild(draggable);
        } else if (draggable) {
            element.insertBefore(draggable, afterElement);
        }
    });
    
    element.addEventListener('drop', (e) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text/plain');
        const card = document.getElementById(cardId);
        
        if (card && element.contains(card)) {
            // Card was reordered within the same column
            // Nothing special to do
        } else if (card) {
            // Card was moved to a different column
            element.appendChild(card);
        }
        
        const columnId = element.getAttribute('data-column-id');
        sortCardsByVotes(columnId);
    });
}

// Helper function to determine where to insert the dragged card
export function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
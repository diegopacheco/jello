import { setupDraggable } from './dragdrop.js';
import { saveBoardData, updateCardCounts } from './app.js';

// Function to add a new card to a column
export function addCard(columnId, content = '') {
    const cardsContainer = document.querySelector(`.cards-container[data-column-id="${columnId}"]`);
    const cardId = `card-${Date.now()}`;
    
    const card = document.createElement('div');
    card.className = 'card';
    card.id = cardId;

    if (!content) {
        // Create a new card with a text area for immediate editing
        card.innerHTML = `
            <textarea class="card-edit-textarea" placeholder="Enter card content..."></textarea>
        `;
        
        cardsContainer.appendChild(card);
        
        const textarea = card.querySelector('.card-edit-textarea');
        textarea.focus();
        
        textarea.addEventListener('blur', finishCardCreation);
        textarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishCardCreation();
            }
        });
        
        function finishCardCreation() {
            const newContent = textarea.value.trim();
            if (newContent) {
                card.innerHTML = createCardHtml(cardId, newContent, 0, 0);
                
                // Set initial upvotes data attribute
                card.setAttribute('data-upvotes', 0);
                
                // Make the card draggable
                setupDraggable(card);
                
                // Setup voting buttons
                setupVotingButtons(card);
                
                // Setup card event listeners
                setupCardEventListeners(card, columnId);
                
                updateCardCounts();
                saveBoardData();
            } else {
                card.remove();
            }
        }
    } else {
        // Create a card with existing content (used when loading from localStorage)
        let upvotes = 0;
        let downvotes = 0;
        let cardText = content;
        
        // Check if content is an object (from updated localStorage format)
        if (typeof content === 'object' && content !== null) {
            upvotes = content.upvotes || 0;
            downvotes = content.downvotes || 0;
            cardText = content.text;
        }
        
        card.innerHTML = createCardHtml(cardId, cardText, upvotes, downvotes);
        
        // Set data attribute for upvotes
        card.setAttribute('data-upvotes', upvotes);
        
        cardsContainer.appendChild(card);
        
        // Make the card draggable
        setupDraggable(card);
        
        // Setup voting buttons
        setupVotingButtons(card);
        
        // Setup card event listeners
        setupCardEventListeners(card, columnId);
    }
    
    return cardId;
}

// Helper function to create card HTML
function createCardHtml(cardId, content, upvotes, downvotes) {
    return `
        <div class="card-content">${content}</div>
        <div class="card-actions">
            <div class="voting-buttons">
                <button class="vote-up-btn" data-card-id="${cardId}">
                    <img src="images/up.png" alt="Upvote" class="vote-icon">
                </button>
                <span class="upvote-count">${upvotes}</span>
                <button class="vote-down-btn" data-card-id="${cardId}">
                    <img src="images/down.png" alt="Downvote" class="vote-icon">
                </button>
                <span class="downvote-count">${downvotes}</span>
            </div>
            <button class="delete-card-btn" data-card-id="${cardId}">✕</button>
        </div>
    `;
}

// Setup card event listeners (delete and edit)
function setupCardEventListeners(card, columnId) {
    // Add event listener for delete card button
    const deleteCardBtn = card.querySelector('.delete-card-btn');
    deleteCardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        card.remove();
        updateCardCounts();
        saveBoardData();
    });
    
    // Add event listener for editing card content
    const cardContent = card.querySelector('.card-content');
    cardContent.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Save voting data before editing
        const upvotes = card.querySelector('.upvote-count').textContent;
        const downvotes = card.querySelector('.downvote-count').textContent;
        const cardId = card.id;
        
        const currentContent = cardContent.textContent;
        card.innerHTML = `
            <textarea class="card-edit-textarea">${currentContent}</textarea>
        `;
        
        const editTextarea = card.querySelector('.card-edit-textarea');
        editTextarea.focus();
        
        editTextarea.addEventListener('blur', finishCardEdit);
        editTextarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishCardEdit();
            }
        });
        
        function finishCardEdit() {
            const updatedContent = editTextarea.value.trim();
            if (updatedContent) {
                card.innerHTML = createCardHtml(cardId, updatedContent, upvotes, downvotes);
                
                // Restore data attribute for upvotes
                card.setAttribute('data-upvotes', upvotes);
                
                // Make the card draggable again
                setupDraggable(card);
                
                // Setup voting buttons again
                setupVotingButtons(card);
                
                // Re-setup card event listeners
                setupCardEventListeners(card, columnId);
                
                saveBoardData();
            } else {
                card.remove();
                updateCardCounts();
                saveBoardData();
            }
        }
    });
}

export function setupVotingButtons(card) {
    const upBtn = card.querySelector('.vote-up-btn');
    const downBtn = card.querySelector('.vote-down-btn');
    const upCount = card.querySelector('.upvote-count');
    const downCount = card.querySelector('.downvote-count');
    
    upBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        let count = parseInt(upCount.textContent);
        upCount.textContent = ++count;
        
        // Update data attribute for styling based on vote count
        card.setAttribute('data-upvotes', count);
        
        // Get the column ID to sort cards
        const columnId = card.closest('.cards-container').getAttribute('data-column-id');
        
        // Sort cards after upvoting
        sortCardsByVotes(columnId);
        
        saveBoardData();
    });
    
    downBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        let count = parseInt(downCount.textContent);
        downCount.textContent = ++count;
        saveBoardData();
    });
}

export function sortCardsByVotes(columnId) {
    const cardsContainer = document.querySelector(`.cards-container[data-column-id="${columnId}"]`);
    if (!cardsContainer) return;
    
    const cards = Array.from(cardsContainer.querySelectorAll('.card'));
    
    // Sort cards by upvote count (highest first)
    cards.sort((a, b) => {
        const aUpvotes = parseInt(a.querySelector('.upvote-count').textContent) || 0;
        const bUpvotes = parseInt(b.querySelector('.upvote-count').textContent) || 0;
        return bUpvotes - aUpvotes; // Descending order (highest votes first)
    });
    
    // Re-append cards in the new order
    cards.forEach(card => {
        cardsContainer.appendChild(card);
    });
}
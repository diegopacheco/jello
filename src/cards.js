import { setupDraggable } from './dragdrop.js';
import { saveBoardData, updateCardCounts } from './app.js';

export function addCard(columnId, content = '') {
    const cardsContainer = document.querySelector(`.cards-container[data-column-id="${columnId}"]`);
    if (!cardsContainer) return null;
    
    const cardId = `card-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const card = document.createElement('div');
    card.className = 'card';
    card.id = cardId;

    if (!content) {
        const textarea = document.createElement('textarea');
        textarea.className = 'card-edit-textarea';
        textarea.placeholder = 'Enter card content...';
        card.appendChild(textarea);
        cardsContainer.appendChild(card);
        textarea.focus();
        
        const finishCardCreation = () => {
            const newContent = textarea.value.trim();
            if (newContent) {
                setupCardWithContent(card, cardId, newContent, 0, 0);
                updateCardCounts();
                saveBoardData();
            } else {
                card.remove();
            }
        };
        
        textarea.addEventListener('blur', finishCardCreation);
        textarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                textarea.blur();
            }
        });
    } else {
        let upvotes = 0;
        let downvotes = 0;
        let cardText = '';
        
        if (typeof content === 'object' && content !== null) {
            upvotes = content.upvotes || 0;
            downvotes = content.downvotes || 0;
            cardText = content.text || content.toString();
        } else {
            cardText = content.toString();
        }
        
        setupCardWithContent(card, cardId, cardText, upvotes, downvotes);
        cardsContainer.appendChild(card);
    }
    
    return cardId;
}

export function setupCardWithContent(card, cardId, content, upvotes, downvotes) {
    while (card.firstChild) {
        card.removeChild(card.firstChild);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'card-content';
    contentDiv.textContent = content;
    card.appendChild(contentDiv);
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'card-actions';
    card.appendChild(actionsDiv);
    
    const votingDiv = document.createElement('div');
    votingDiv.className = 'voting-buttons';
    actionsDiv.appendChild(votingDiv);
    
    const upBtn = document.createElement('button');
    upBtn.className = 'vote-up-btn';
    upBtn.dataset.cardId = cardId;
    upBtn.textContent = '👍';
    
    try {
        const upImg = document.createElement('img');
        upImg.src = 'images/up.png';
        upImg.alt = 'Upvote';
        upImg.className = 'vote-icon';
        upImg.onerror = () => {
            upBtn.textContent = '👍';
        };
        upBtn.textContent = '';
        upBtn.appendChild(upImg);
    } catch (e) {
        console.warn('Failed to create upvote image, using emoji fallback');
    }
    
    votingDiv.appendChild(upBtn);
    
    const upCountElement = document.createElement('span');
    upCountElement.className = 'upvote-count';
    upCountElement.textContent = upvotes || '0';
    votingDiv.appendChild(upCountElement);
    
    const downBtn = document.createElement('button');
    downBtn.className = 'vote-down-btn';
    downBtn.dataset.cardId = cardId;
    downBtn.textContent = '👎';
    
    try {
        const downImg = document.createElement('img');
        downImg.src = 'images/down.png';
        downImg.alt = 'Downvote';
        downImg.className = 'vote-icon';
        downImg.onerror = () => {
            downBtn.textContent = '👎';
        };
        downBtn.textContent = '';
        downBtn.appendChild(downImg);
    } catch (e) {
        console.warn('Failed to create downvote image, using emoji fallback');
    }
    
    votingDiv.appendChild(downBtn);
    
    const downCountElement = document.createElement('span');
    downCountElement.className = 'downvote-count';
    downCountElement.textContent = downvotes || '0';
    votingDiv.appendChild(downCountElement);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-card-btn';
    deleteBtn.dataset.cardId = cardId;
    deleteBtn.textContent = '✕';
    actionsDiv.appendChild(deleteBtn);
    
    card.setAttribute('data-upvotes', upvotes || '0');
    setupDraggable(card);
    
    if (card.closest('.cards-container')) {
        setupCardEventListeners(card);
    } else {
        setTimeout(() => {
            if (card.closest('.cards-container')) {
                setupCardEventListeners(card);
            }
        }, 0);
    }
}

function setupCardEventListeners(card) {
    if (!card || !card.closest('.cards-container')) {
        return;
    }
    
    const columnId = card.closest('.cards-container').dataset.columnId;
    const deleteBtn = card.querySelector('.delete-card-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            card.remove();
            updateCardCounts();
            saveBoardData();
        });
    }
    
    const contentDiv = card.querySelector('.card-content');
    if (contentDiv) {
        contentDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const currentContent = contentDiv.textContent;
            const upvotes = card.querySelector('.upvote-count')?.textContent || '0';
            const downvotes = card.querySelector('.downvote-count')?.textContent || '0';
            
            const textarea = document.createElement('textarea');
            textarea.className = 'card-edit-textarea';
            textarea.value = currentContent;
            
            while (card.firstChild) {
                card.removeChild(card.firstChild);
            }
            card.appendChild(textarea);
            textarea.focus();
            
            const finishEditing = () => {
                const updatedContent = textarea.value.trim();
                if (updatedContent) {
                    setupCardWithContent(card, card.id, updatedContent, upvotes, downvotes);
                    saveBoardData();
                } else {
                    card.remove();
                    updateCardCounts();
                    saveBoardData();
                }
            };
            
            textarea.addEventListener('blur', finishEditing);
            textarea.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    textarea.blur();
                }
            });
        });
    }
    
    setupVotingButtons(card);
}

export function setupVotingButtons(card) {
    if (!card || !card.closest('.cards-container')) {
        return;
    }
    
    const upBtn = card.querySelector('.vote-up-btn');
    const downBtn = card.querySelector('.vote-down-btn');
    const upCount = card.querySelector('.upvote-count');
    const downCount = card.querySelector('.downvote-count');
    
    const columnId = card.closest('.cards-container').dataset.columnId;
    
    if (upBtn && upCount) {
        const newUpBtn = upBtn.cloneNode(true);
        upBtn.parentNode.replaceChild(newUpBtn, upBtn);
        
        newUpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let count = parseInt(upCount.textContent || '0');
            upCount.textContent = ++count;
            
            card.setAttribute('data-upvotes', count);
            sortCardsByVotes(columnId);
            saveBoardData();
        });
    }
    
    if (downBtn && downCount) {
        const newDownBtn = downBtn.cloneNode(true);
        downBtn.parentNode.replaceChild(newDownBtn, downBtn);
        
        newDownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let count = parseInt(downCount.textContent || '0');
            downCount.textContent = ++count;
            saveBoardData();
        });
    }
}

export function sortCardsByVotes(columnId) {
    const cardsContainer = document.querySelector(`.cards-container[data-column-id="${columnId}"]`);
    if (!cardsContainer) return;
    
    const cards = Array.from(cardsContainer.querySelectorAll('.card'));
    if (cards.length <= 1) return;
    
    cards.sort((a, b) => {
        const aUpvotes = parseInt(a.querySelector('.upvote-count')?.textContent || '0');
        const bUpvotes = parseInt(b.querySelector('.upvote-count')?.textContent || '0');
        return bUpvotes - aUpvotes;
    });
    
    cards.forEach(card => {
        cardsContainer.appendChild(card);
    });
}

export function deleteCard(columnId, cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    card.remove();
    updateCardCounts();
    saveBoardData();
}

export function moveCard(cardId, sourceColumnId, targetColumnId) {
    const card = document.getElementById(cardId);
    const targetContainer = document.querySelector(`.cards-container[data-column-id="${targetColumnId}"]`);
    
    if (card && targetContainer) {
        targetContainer.appendChild(card);
        sortCardsByVotes(targetColumnId);
        updateCardCounts();
        saveBoardData();
    }
}
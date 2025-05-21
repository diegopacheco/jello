document.addEventListener('DOMContentLoaded', () => {
    // Get the board container and add column button
    const board = document.getElementById('board');
    const addColumnBtn = document.getElementById('add-column-btn');

    // Keep track of the next column ID
    let nextColumnId = 1;

    // Load data from localStorage if available
    loadBoardData();

    // Add event listener for adding new columns
    addColumnBtn.addEventListener('click', () => {
        addColumn();
    });

    // Function to add a new column
    function addColumn(title = `Column ${nextColumnId}`) {
        const columnId = `column-${nextColumnId++}`;
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
    function setupColumnEvents(columnId) {
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

    // Function to setup voting buttons for a card
    function setupVotingButtons(card) {
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

    // Function to make an element draggable
    function setupDraggable(element) {
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
    
    // Function to set up a drop zone
    function setupDropZone(element) {
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
            
            // Get the column ID to sort cards
            const columnId = element.getAttribute('data-column-id');
            
            // Sort cards after dropping
            sortCardsByVotes(columnId);
        });
    }
    
    // Helper function to determine where to insert the dragged card
    function getDragAfterElement(container, y) {
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

    // Function to add a new card to a column
    function addCard(columnId, content = '') {
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
                    card.innerHTML = `
                    <div class="card-content">${newContent}</div>
                    <div class="card-actions">
                        <div class="voting-buttons">
                            <button class="vote-up-btn" data-card-id="${cardId}">
                                <img src="images/up.png" alt="Upvote" class="vote-icon">
                            </button>
                            <span class="upvote-count">0</span>
                            <button class="vote-down-btn" data-card-id="${cardId}">
                                <img src="images/down.png" alt="Downvote" class="vote-icon">
                            </button>
                            <span class="downvote-count">0</span>
                        </div>
                        <button class="delete-card-btn" data-card-id="${cardId}">✕</button>
                    </div>
                `;
                    
                    // Set initial upvotes data attribute
                    card.setAttribute('data-upvotes', 0);
                    
                    // Make the card draggable
                    setupDraggable(card);
                    
                    // Setup voting buttons
                    setupVotingButtons(card);
                    
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
                                card.innerHTML = `
                                <div class="card-content">${updatedContent}</div>
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
                                
                                // Restore data attribute for upvotes
                                card.setAttribute('data-upvotes', upvotes);
                                
                                // Make the card draggable again
                                setupDraggable(card);
                                
                                // Setup voting buttons again
                                setupVotingButtons(card);
                                
                                // Re-add event listeners
                                const newDeleteCardBtn = card.querySelector('.delete-card-btn');
                                newDeleteCardBtn.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    card.remove();
                                    updateCardCounts();
                                    saveBoardData();
                                });
                                
                                const newCardContent = card.querySelector('.card-content');
                                newCardContent.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    cardContent.click(); // Reuse the click handler
                                });
                                
                                saveBoardData();
                            } else {
                                card.remove();
                                updateCardCounts();
                                saveBoardData();
                            }
                        }
                    });
                    
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
            
            card.innerHTML = `
                <div class="card-content">${cardText}</div>
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
            
            // Set data attribute for upvotes
            card.setAttribute('data-upvotes', upvotes);
            
            cardsContainer.appendChild(card);
            
            // Make the card draggable
            setupDraggable(card);
            
            // Setup voting buttons
            setupVotingButtons(card);
            
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
                
                const currentContent = cardContent.textContent;
                card.innerHTML = `
                    <textarea class="card-edit-textarea">${currentContent}</textarea>
                `;
                
                const editTextarea = card.querySelector('.card-edit-textarea');
                editTextarea.focus();
                
                editTextarea.addEventListener('blur', () => {
                    const updatedContent = editTextarea.value.trim();
                    if (updatedContent) {
                        card.innerHTML = `
                            <div class="card-content">${updatedContent}</div>
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
                        
                        // Restore data attribute for upvotes
                        card.setAttribute('data-upvotes', upvotes);
                        
                        // Make the card draggable again
                        setupDraggable(card);
                        
                        // Setup voting buttons again
                        setupVotingButtons(card);
                        
                        // Re-add event listeners
                        const newDeleteCardBtn = card.querySelector('.delete-card-btn');
                        newDeleteCardBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            card.remove();
                            updateCardCounts();
                            saveBoardData();
                        });
                        
                        const newCardContent = card.querySelector('.card-content');
                        newCardContent.addEventListener('click', (e) => {
                            e.stopPropagation();
                            cardContent.click(); // Reuse the click handler
                        });
                        
                        saveBoardData();
                    } else {
                        card.remove();
                        updateCardCounts();
                        saveBoardData();
                    }
                });
            });
        }
        
        return cardId;
    }

    // Function to update card counts for all columns
    function updateCardCounts() {
        const columns = document.querySelectorAll('.column');
        columns.forEach(column => {
            const columnId = column.id;
            const cardCount = column.querySelectorAll('.card').length;
            const cardCountElement = column.querySelector('.card-count');
            cardCountElement.textContent = `(${cardCount})`;
        });
    }

    // Function to save board data to localStorage
    function saveBoardData() {
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
        localStorage.setItem('jelloNextColumnId', nextColumnId);
    }

    // Function to load board data from localStorage
    function loadBoardData() {
        const savedData = localStorage.getItem('jelloBoard');
        const savedNextId = localStorage.getItem('jelloNextColumnId');
    
        if (savedNextId) {
            nextColumnId = parseInt(savedNextId);
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
    
    // Function to sort cards by votes
    function sortCardsByVotes(columnId) {
        const cardsContainer = document.querySelector(`.cards-container[data-column-id="${columnId}"]`);
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
});
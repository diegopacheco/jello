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
            <div class="cards-container" data-column-id="${columnId}"></div>
            <button class="add-card-btn" data-column-id="${columnId}">+ Add a card</button>
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
                        <button class="delete-card-btn" data-card-id="${cardId}">✕</button>
                    `;
                    
                    // Add event listener for delete card button
                    const deleteCardBtn = card.querySelector('.delete-card-btn');
                    deleteCardBtn.addEventListener('click', () => {
                        card.remove();
                        updateCardCounts();
                        saveBoardData();
                    });
                    
                    // Add event listener for editing card content
                    const cardContent = card.querySelector('.card-content');
                    cardContent.addEventListener('click', () => {
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
                                    <button class="delete-card-btn" data-card-id="${cardId}">✕</button>
                                `;
                                
                                // Re-add event listeners
                                const newDeleteCardBtn = card.querySelector('.delete-card-btn');
                                newDeleteCardBtn.addEventListener('click', () => {
                                    card.remove();
                                    updateCardCounts();
                                    saveBoardData();
                                });
                                
                                card.querySelector('.card-content').addEventListener('click', () => {
                                    cardContent.click(); // Reuse the click handler
                                });
                                
                                saveBoardData();
                            } else {
                                card.remove();
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
            card.innerHTML = `
                <div class="card-content">${content}</div>
                <button class="delete-card-btn" data-card-id="${cardId}">✕</button>
            `;
            
            cardsContainer.appendChild(card);
            
            // Add event listener for delete card button
            const deleteCardBtn = card.querySelector('.delete-card-btn');
            deleteCardBtn.addEventListener('click', () => {
                card.remove();
                updateCardCounts();
                saveBoardData();
            });
            
            // Add event listener for editing card content
            const cardContent = card.querySelector('.card-content');
            cardContent.addEventListener('click', () => {
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
                            <button class="delete-card-btn" data-card-id="${cardId}">✕</button>
                        `;
                        
                        // Re-add event listeners
                        const newDeleteCardBtn = card.querySelector('.delete-card-btn');
                        newDeleteCardBtn.addEventListener('click', () => {
                            card.remove();
                            updateCardCounts();
                            saveBoardData();
                        });
                        
                        card.querySelector('.card-content').addEventListener('click', () => {
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
                    cards.push(cardContent);
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
            });
            
            updateCardCounts();
        } else {
            // Add a default column if no data exists
            addColumn('To Do');
        }
    }
});
import { addCard, sortCardsByVotes, setupVotingButtons } from './cards.js';
import { saveBoardData, updateCardCounts } from './app.js';

export function setupImportFunctionality() {
    const importBtn = document.getElementById('import-btn');
    const modal = document.getElementById('import-modal');
    const closeModal = document.querySelector('.close-modal');
    const importSubmit = document.getElementById('import-submit');
    const importTextarea = document.getElementById('import-textarea');
    
    importBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        importTextarea.focus();
    });
    
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        importTextarea.value = '';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            importTextarea.value = '';
        }
    });
    
    importSubmit.addEventListener('click', () => {
        importCards();
    });
    
    importTextarea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            importCards();
        }
    });
    
    function importCards() {
        const text = importTextarea.value.trim();
        
        if (!text) {
            alert('Please enter at least one card description.');
            return;
        }
        
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            alert('Please enter at least one valid card description.');
            return;
        }
        
        const columns = document.querySelectorAll('.column');
        if (columns.length === 0) {
            alert('Please create at least one column first.');
            modal.style.display = 'none';
            importTextarea.value = '';
            return;
        }
        
        const firstColumn = columns[0];
        const columnId = firstColumn.id;
        
        let cardsAdded = 0;
        
        const processNextLine = (index) => {
            if (index >= lines.length) {
                setTimeout(() => {
                    sortCardsByVotes(columnId);
                    updateCardCounts();
                    document.querySelectorAll('.card').forEach(card => {
                        if (card.closest('.cards-container')) {
                            setupVotingButtons(card);
                        }
                    });
                    
                    saveBoardData();
                    modal.style.display = 'none';
                    importTextarea.value = '';
                    alert(`Successfully added ${cardsAdded} cards to the first column.`);
                }, 100);
                return;
            }
            
            const line = lines[index];
            if (line.trim()) {
                addCard(columnId, line.trim());
                cardsAdded++;
            }
            
            setTimeout(() => {
                processNextLine(index + 1);
            }, 50);
        };
        
        processNextLine(0);
    }
}
export function updateCardCounts() {
    const columns = document.querySelectorAll('.column');
    columns.forEach(column => {
        const columnId = column.id;
        const cardCount = column.querySelectorAll('.card').length;
        const cardCountElement = column.querySelector('.card-count');
        cardCountElement.textContent = `(${cardCount})`;
    });
}
const fs = require('fs/promises');
const path = require('path');

const filepath = path.join(__dirname, '..', 'data', 'cards.json');
async function readCards() {
        let data;
    try {
                data = await fs.readFile(filepath, 'utf-8');
    } catch (error) {
            if (error.code === 'ENOENT') return [];
      console.error('Error reading cards.json:', error.message);
            throw error;
    }

        return JSON.parse(data);
}

async function writeCards(cards) {
    try {
        await fs.writeFile(filepath, JSON.stringify(cards, null, 2));
    } catch (error) {
      console.error('Error writing to cards.json:', error.message);
            throw error;
    }
}

module.exports = {
    readCards,
    writeCards
};

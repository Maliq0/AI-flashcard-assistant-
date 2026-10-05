require('dotenv').config();
const express = require('express');
const path = require('path');
const cardsRouter = require('./routes/cards');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/cards', cardsRouter);

if (require.main === module) {
	const PORT = process.env.PORT || 3000;
	app.listen(PORT, () => {
		console.log(`Server running at http://localhost:${PORT}`);
	});
}

module.exports = app;

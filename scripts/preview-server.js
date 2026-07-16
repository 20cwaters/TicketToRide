// Tiny static server for board-preview.html (dev tool only).
const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(__dirname));
app.listen(4173, () => console.log('board preview on :4173'));
